const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('../utils/logger');

/**
 * Service de gestion des fichiers
 */
class FileService {
  constructor() {
    this.storageType = process.env.STORAGE_TYPE || 'local';
    this.localStoragePath = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../../uploads');
    
    // Configuration S3 si nécessaire
    if (this.storageType === 's3') {
      this.s3Client = new S3Client({
        region: process.env.S3_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY,
          secretAccessKey: process.env.S3_SECRET_KEY
        }
      });
      this.s3Bucket = process.env.S3_BUCKET;
    }
    
    // Initialiser le stockage local si nécessaire
    this.initializeLocalStorage();
  }
  
  /**
   * Crée les dossiers de stockage locaux si nécessaire
   */
  async initializeLocalStorage() {
    if (this.storageType === 'local') {
      try {
        await fs.access(this.localStoragePath);
      } catch (error) {
        // Créer le dossier s'il n'existe pas
        await fs.mkdir(this.localStoragePath, { recursive: true });
        await fs.mkdir(path.join(this.localStoragePath, 'documents'), { recursive: true });
        await fs.mkdir(path.join(this.localStoragePath, 'temp'), { recursive: true });
        
        logger.info(`Dossiers de stockage créés: ${this.localStoragePath}`);
      }
    }
  }
  
  /**
   * Stocke un document (fichier uploadé)
   * @param {Object} file - Objet fichier (req.file de multer)
   * @returns {Promise<String>} Chemin du fichier stocké
   */
  async storeDocument(file) {
    try {
      // Générer un nom de fichier unique
      const filename = this.generateUniqueFilename(file.originalname);
      
      // Stocker le fichier selon le mode configuré
      if (this.storageType === 's3') {
        return this.storeDocumentS3(file.buffer, filename, file.mimetype);
      } else {
        return this.storeDocumentLocal(file.path, filename);
      }
    } catch (error) {
      logger.error(`Erreur lors du stockage du document: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Stocke un document en local
   * @param {String} tempPath - Chemin temporaire du fichier
   * @param {String} filename - Nom de fichier final
   * @returns {Promise<String>} Chemin du fichier stocké
   */
  async storeDocumentLocal(tempPath, filename) {
    try {
      // Chemin de destination
      const destPath = path.join(this.localStoragePath, 'documents', filename);
      
      // Déplacer le fichier
      await fs.copyFile(tempPath, destPath);
      
      // Supprimer le fichier temporaire si nécessaire
      if (tempPath !== destPath) {
        try {
          await fs.unlink(tempPath);
        } catch (unlinkError) {
          logger.warn(`Impossible de supprimer le fichier temporaire: ${unlinkError.message}`);
        }
      }
      
      logger.info(`Document stocké localement: ${destPath}`);
      return destPath;
    } catch (error) {
      logger.error(`Erreur lors du stockage local du document: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Stocke un document sur S3
   * @param {Buffer} buffer - Contenu du fichier
   * @param {String} filename - Nom de fichier
   * @param {String} contentType - Type MIME du fichier
   * @returns {Promise<String>} URL S3 du fichier
   */
  async storeDocumentS3(buffer, filename, contentType) {
    try {
      // Clé S3 (chemin complet dans le bucket)
      const key = `documents/${filename}`;
      
      // Envoi vers S3
      const command = new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType
      });
      
      await this.s3Client.send(command);
      
      logger.info(`Document stocké sur S3: ${key}`);
      return `s3://${this.s3Bucket}/${key}`;
    } catch (error) {
      logger.error(`Erreur lors du stockage S3 du document: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Récupère un document stocké
   * @param {String} filePath - Chemin ou URL du fichier
   * @returns {Promise<Buffer>} Contenu du fichier
   */
  async getDocument(filePath) {
    try {
      // Vérifier si le chemin est une URL S3
      if (filePath.startsWith('s3://')) {
        return this.getDocumentFromS3(filePath);
      } else {
        return this.getDocumentFromLocal(filePath);
      }
    } catch (error) {
      logger.error(`Erreur lors de la récupération du document: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Récupère un document stocké localement
   * @param {String} filePath - Chemin du fichier
   * @returns {Promise<Buffer>} Contenu du fichier
   */
  async getDocumentFromLocal(filePath) {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      logger.error(`Erreur lors de la lecture du fichier local: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Récupère un document stocké sur S3
   * @param {String} s3Url - URL S3 du fichier (s3://bucket/key)
   * @returns {Promise<Buffer>} Contenu du fichier
   */
  async getDocumentFromS3(s3Url) {
    try {
      // Extraire le bucket et la clé de l'URL
      const parts = s3Url.replace('s3://', '').split('/');
      const bucket = parts[0];
      const key = parts.slice(1).join('/');
      
      // Récupérer depuis S3
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });
      
      const response = await this.s3Client.send(command);
      
      // Convertir le stream en buffer
      return await this.streamToBuffer(response.Body);
    } catch (error) {
      logger.error(`Erreur lors de la récupération S3 du document: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Créé une URL signée pour accéder temporairement à un document S3
   * @param {String} s3Url - URL S3 du fichier (s3://bucket/key)
   * @param {Number} expiresIn - Durée de validité en secondes (défaut: 900s = 15min)
   * @returns {Promise<String>} URL signée
   */
  async getSignedUrl(s3Url, expiresIn = 900) {
    try {
      if (!s3Url.startsWith('s3://')) {
        throw new Error('URL S3 invalide');
      }
      
      // Extraire le bucket et la clé de l'URL
      const parts = s3Url.replace('s3://', '').split('/');
      const bucket = parts[0];
      const key = parts.slice(1).join('/');
      
      // Créer la commande
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });
      
      // Générer l'URL signée
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      logger.error(`Erreur lors de la génération de l'URL signée: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Supprime un document
   * @param {String} filePath - Chemin ou URL du fichier
   * @returns {Promise<Boolean>} Succès de la suppression
   */
  async deleteDocument(filePath) {
    try {
      // Vérifier si le chemin est une URL S3
      if (filePath.startsWith('s3://')) {
        return this.deleteDocumentFromS3(filePath);
      } else {
        return this.deleteDocumentFromLocal(filePath);
      }
    } catch (error) {
      logger.error(`Erreur lors de la suppression du document: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Supprime un document stocké localement
   * @param {String} filePath - Chemin du fichier
   * @returns {Promise<Boolean>} Succès de la suppression
   */
  async deleteDocumentFromLocal(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`Document supprimé: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du fichier local: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Supprime un document stocké sur S3
   * @param {String} s3Url - URL S3 du fichier (s3://bucket/key)
   * @returns {Promise<Boolean>} Succès de la suppression
   */
  async deleteDocumentFromS3(s3Url) {
    try {
      // Extraire le bucket et la clé de l'URL
      const parts = s3Url.replace('s3://', '').split('/');
      const bucket = parts[0];
      const key = parts.slice(1).join('/');
      
      // Supprimer de S3
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      });
      
      await this.s3Client.send(command);
      
      logger.info(`Document S3 supprimé: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression S3 du document: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Crée un fichier temporaire
   * @param {Buffer|String} content - Contenu du fichier
   * @param {String} extension - Extension du fichier (par défaut: .tmp)
   * @returns {Promise<String>} Chemin du fichier temporaire
   */
  async createTempFile(content, extension = '.tmp') {
    try {
      // Créer le dossier temporaire s'il n'existe pas
      const tempDir = path.join(this.localStoragePath, 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      // Générer un nom de fichier unique
      const filename = `${crypto.randomBytes(16).toString('hex')}${extension}`;
      const filePath = path.join(tempDir, filename);
      
      // Écrire le contenu
      await fs.writeFile(filePath, content);
      
      logger.debug(`Fichier temporaire créé: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Erreur lors de la création du fichier temporaire: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Convertit un stream en buffer
   * @param {Stream} stream - Stream à convertir
   * @returns {Promise<Buffer>} Buffer
   */
  async streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
  
  /**
   * Génère un nom de fichier unique basé sur le nom d'origine
   * @param {String} originalName - Nom de fichier d'origine
   * @returns {String} Nom de fichier unique
   */
  generateUniqueFilename(originalName) {
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    
    return `${base.replace(/[^a-z0-9]/gi, '_')}_${timestamp}_${random}${ext}`;
  }
}

module.exports = new FileService();