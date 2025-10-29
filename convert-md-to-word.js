const fs = require('fs').promises;
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

/**
 * Script de conversion Markdown vers Word (DOCX)
 * Utilise la bibliothèque docx pour créer des documents Word
 */

// Fonction de parsing simple du markdown
function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const elements = [];

  let inCodeBlock = false;
  let codeContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // Fin du code block
        elements.push({
          type: 'code',
          content: codeContent.join('\n')
        });
        codeContent = [];
        inCodeBlock = false;
      } else {
        // Début du code block
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Titres
    if (line.startsWith('# ')) {
      elements.push({ type: 'h1', content: line.substring(2) });
    } else if (line.startsWith('## ')) {
      elements.push({ type: 'h2', content: line.substring(3) });
    } else if (line.startsWith('### ')) {
      elements.push({ type: 'h3', content: line.substring(4) });
    } else if (line.startsWith('#### ')) {
      elements.push({ type: 'h4', content: line.substring(5) });
    }
    // Listes
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push({ type: 'list', content: line.substring(2) });
    }
    // Ligne vide
    else if (line.trim() === '') {
      elements.push({ type: 'empty' });
    }
    // Paragraphe normal
    else {
      elements.push({ type: 'paragraph', content: line });
    }
  }

  return elements;
}

// Fonction de conversion en paragraphes Word
function elementToWordParagraph(element) {
  switch (element.type) {
    case 'h1':
      return new Paragraph({
        text: element.content,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      });

    case 'h2':
      return new Paragraph({
        text: element.content,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 }
      });

    case 'h3':
      return new Paragraph({
        text: element.content,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 }
      });

    case 'h4':
      return new Paragraph({
        text: element.content,
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 150, after: 80 }
      });

    case 'list':
      return new Paragraph({
        text: `• ${element.content}`,
        bullet: { level: 0 },
        spacing: { before: 50, after: 50 }
      });

    case 'code':
      return new Paragraph({
        children: [
          new TextRun({
            text: element.content,
            font: 'Courier New',
            size: 20
          })
        ],
        spacing: { before: 100, after: 100 },
        shading: { fill: 'F5F5F5' }
      });

    case 'empty':
      return new Paragraph({ text: '' });

    case 'paragraph':
    default:
      // Gérer le gras (**text**) et l'italique (*text*)
      const content = element.content || '';
      const parts = [];
      let currentText = '';
      let i = 0;

      while (i < content.length) {
        // Gras
        if (content.substring(i, i + 2) === '**') {
          if (currentText) {
            parts.push(new TextRun({ text: currentText }));
            currentText = '';
          }
          const endIndex = content.indexOf('**', i + 2);
          if (endIndex !== -1) {
            parts.push(new TextRun({ text: content.substring(i + 2, endIndex), bold: true }));
            i = endIndex + 2;
          } else {
            currentText += '**';
            i += 2;
          }
        }
        // Italique
        else if (content[i] === '*' && content[i + 1] !== '*') {
          if (currentText) {
            parts.push(new TextRun({ text: currentText }));
            currentText = '';
          }
          const endIndex = content.indexOf('*', i + 1);
          if (endIndex !== -1) {
            parts.push(new TextRun({ text: content.substring(i + 1, endIndex), italics: true }));
            i = endIndex + 1;
          } else {
            currentText += '*';
            i++;
          }
        }
        // Code inline
        else if (content[i] === '`') {
          if (currentText) {
            parts.push(new TextRun({ text: currentText }));
            currentText = '';
          }
          const endIndex = content.indexOf('`', i + 1);
          if (endIndex !== -1) {
            parts.push(new TextRun({
              text: content.substring(i + 1, endIndex),
              font: 'Courier New',
              shading: { fill: 'F5F5F5' }
            }));
            i = endIndex + 1;
          } else {
            currentText += '`';
            i++;
          }
        }
        else {
          currentText += content[i];
          i++;
        }
      }

      if (currentText) {
        parts.push(new TextRun({ text: currentText }));
      }

      return new Paragraph({
        children: parts.length > 0 ? parts : [new TextRun({ text: content })],
        spacing: { before: 80, after: 80 }
      });
  }
}

// Fonction principale de conversion
async function convertMarkdownToWord(mdFilePath, outputPath) {
  try {
    console.log(`Lecture du fichier: ${mdFilePath}`);
    const markdownContent = await fs.readFile(mdFilePath, 'utf-8');

    console.log('Parsing du contenu Markdown...');
    const elements = parseMarkdown(markdownContent);

    console.log('Création du document Word...');
    const paragraphs = elements.map(elementToWordParagraph);

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });

    console.log(`Génération du fichier Word: ${outputPath}`);
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(outputPath, buffer);

    console.log(`✓ Conversion réussie: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`✗ Erreur lors de la conversion de ${mdFilePath}:`, error.message);
    return false;
  }
}

// Fonction pour convertir tous les fichiers MD du projet
async function convertAllMarkdownFiles() {
  const files = [
    { input: 'README.md', output: 'README.docx' },
    { input: 'TEMPERATURE_SURVEILLANCE.md', output: 'TEMPERATURE_SURVEILLANCE.docx' }
  ];

  console.log('=== Conversion Markdown vers Word ===\n');

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const inputPath = path.join(__dirname, file.input);
    const outputPath = path.join(__dirname, file.output);

    // Vérifier si le fichier existe
    try {
      await fs.access(inputPath);
    } catch (error) {
      console.log(`⊘ Fichier non trouvé: ${file.input}`);
      failCount++;
      continue;
    }

    const success = await convertMarkdownToWord(inputPath, outputPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n=== Résumé ===`);
  console.log(`✓ Conversions réussies: ${successCount}`);
  console.log(`✗ Conversions échouées: ${failCount}`);
}

// Exécution
convertAllMarkdownFiles().catch(console.error);
