import React from 'react';
import { Box } from '@mui/material';

/**
 * Composant pour représenter une table rectangulaire
 */
const RectangularTable = ({ x, y, width, height, color, seats, tableId }) => {
  const seatWidth = 60;
  const seatHeight = 30;

  return (
    <g>
      {/* Table */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="#8B7355"
        strokeWidth="2"
        rx="5"
      />

      {/* Emplacements pour noms - 2 en haut, 2 en bas */}
      {seats === 4 && (
        <>
          {/* Haut gauche */}
          <rect
            x={x + width * 0.15}
            y={y - seatHeight - 5}
            width={seatWidth}
            height={seatHeight}
            fill="white"
            stroke="#666"
            strokeWidth="1"
            rx="3"
          />
          {/* Haut droite */}
          <rect
            x={x + width * 0.85 - seatWidth}
            y={y - seatHeight - 5}
            width={seatWidth}
            height={seatHeight}
            fill="white"
            stroke="#666"
            strokeWidth="1"
            rx="3"
          />
          {/* Bas gauche */}
          <rect
            x={x + width * 0.15}
            y={y + height + 5}
            width={seatWidth}
            height={seatHeight}
            fill="white"
            stroke="#666"
            strokeWidth="1"
            rx="3"
          />
          {/* Bas droite */}
          <rect
            x={x + width * 0.85 - seatWidth}
            y={y + height + 5}
            width={seatWidth}
            height={seatHeight}
            fill="white"
            stroke="#666"
            strokeWidth="1"
            rx="3"
          />
        </>
      )}
    </g>
  );
};

/**
 * Composant pour représenter une table carrée
 */
const SquareTable = ({ x, y, size, color, seats }) => {
  const seatWidth = 60;
  const seatHeight = 30;

  return (
    <g>
      {/* Table */}
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={color}
        stroke="#8B7355"
        strokeWidth="2"
        rx="5"
      />

      {/* Emplacements pour noms - 1 en haut, 1 en bas */}
      {seats === 2 && (
        <>
          {/* Haut */}
          <rect
            x={x + (size - seatWidth) / 2}
            y={y - seatHeight - 5}
            width={seatWidth}
            height={seatHeight}
            fill="white"
            stroke="#666"
            strokeWidth="1"
            rx="3"
          />
          {/* Bas */}
          <rect
            x={x + (size - seatWidth) / 2}
            y={y + size + 5}
            width={seatWidth}
            height={seatHeight}
            fill="white"
            stroke="#666"
            strokeWidth="1"
            rx="3"
          />
        </>
      )}
    </g>
  );
};

/**
 * Composant pour représenter une table ronde
 */
const RoundTable = ({ x, y, radius, color, seats }) => {
  const seatWidth = 60;
  const seatHeight = 30;

  // Calcul des positions des emplacements autour du cercle
  const seatPositions = [];
  for (let i = 0; i < seats; i++) {
    const angle = (i * 2 * Math.PI) / seats - Math.PI / 2; // Commence en haut
    const seatX = x + Math.cos(angle) * (radius + 20);
    const seatY = y + Math.sin(angle) * (radius + 20);
    seatPositions.push({ x: seatX, y: seatY });
  }

  return (
    <g>
      {/* Table */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={color}
        stroke="#8B7355"
        strokeWidth="2"
      />

      {/* Emplacements pour noms */}
      {seatPositions.map((pos, index) => (
        <rect
          key={index}
          x={pos.x - seatWidth / 2}
          y={pos.y - seatHeight / 2}
          width={seatWidth}
          height={seatHeight}
          fill="white"
          stroke="#666"
          strokeWidth="1"
          rx="3"
        />
      ))}
    </g>
  );
};

/**
 * Composant principal du plan de table
 */
const SeatingPlanTable = () => {
  // Couleurs
  const service1Color = '#D4C4B0'; // Beige/taupe clair
  const service2Color = '#D4B5C4'; // Rose/mauve clair
  const headerColor = '#EDE4D8'; // Beige/crème pour le bandeau

  const svgWidth = 1400;
  const svgHeight = 1000;

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      bgcolor: 'white',
      p: 2
    }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* Bandeau Tisanerie */}
        <rect
          x="20"
          y="20"
          width="250"
          height="50"
          fill={headerColor}
          stroke="#8B7355"
          strokeWidth="2"
          rx="5"
        />
        <text
          x="145"
          y="52"
          textAnchor="middle"
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#333'
          }}
        >
          Tisanerie
        </text>

        {/* Porte Cuisine - Gauche */}
        <text
          x="100"
          y="100"
          textAnchor="middle"
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#555'
          }}
        >
          Porte Cuisine
        </text>

        {/* Porte Plonge - Droite */}
        <text
          x="1300"
          y="100"
          textAnchor="middle"
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#555'
          }}
        >
          Porte Plonge
        </text>

        {/* ZONE PORTE CUISINE (Gauche) */}

        {/* 3 tables rectangulaires beiges */}
        <RectangularTable x={50} y={150} width={120} height={80} color={service1Color} seats={4} />
        <RectangularTable x={50} y={280} width={120} height={80} color={service1Color} seats={4} />
        <RectangularTable x={50} y={410} width={120} height={80} color={service1Color} seats={4} />

        {/* 3 tables carrées beiges */}
        <SquareTable x={200} y={150} size={70} color={service1Color} seats={2} />
        <SquareTable x={200} y={250} size={70} color={service1Color} seats={2} />
        <SquareTable x={200} y={350} size={70} color={service1Color} seats={2} />

        {/* 1 table rectangulaire beige */}
        <RectangularTable x={50} y={540} width={120} height={80} color={service1Color} seats={4} />

        {/* ZONE CENTRALE */}

        {/* 6 tables rectangulaires beiges */}
        <RectangularTable x={400} y={150} width={120} height={80} color={service1Color} seats={4} />
        <RectangularTable x={550} y={150} width={120} height={80} color={service1Color} seats={4} />
        <RectangularTable x={400} y={280} width={120} height={80} color={service1Color} seats={4} />
        <RectangularTable x={550} y={280} width={120} height={80} color={service1Color} seats={4} />
        <RectangularTable x={400} y={410} width={120} height={80} color={service1Color} seats={4} />
        <RectangularTable x={550} y={410} width={120} height={80} color={service1Color} seats={4} />

        {/* 1 table rectangulaire rose/mauve (service 2) */}
        <RectangularTable x={475} y={540} width={120} height={80} color={service2Color} seats={4} />

        {/* Plusieurs tables carrées beiges */}
        <SquareTable x={700} y={150} size={70} color={service1Color} seats={2} />
        <SquareTable x={700} y={250} size={70} color={service1Color} seats={2} />
        <SquareTable x={800} y={150} size={70} color={service1Color} seats={2} />
        <SquareTable x={800} y={250} size={70} color={service1Color} seats={2} />

        {/* ZONE PORTE PLONGE (Droite) */}

        {/* 5 tables rondes roses/mauves (tailles variées) */}
        <RoundTable x={950} y={180} radius={45} color={service2Color} seats={5} />
        <RoundTable x={1100} y={180} radius={50} color={service2Color} seats={5} />
        <RoundTable x={1250} y={180} radius={40} color={service2Color} seats={5} />

        <RoundTable x={1025} y={350} radius={48} color={service2Color} seats={5} />
        <RoundTable x={1200} y={350} radius={52} color={service2Color} seats={5} />

        {/* LÉGENDE - Encadré en bas à gauche */}
        <g>
          {/* Fond de la légende */}
          <rect
            x="30"
            y="700"
            width="420"
            height="260"
            fill={headerColor}
            stroke="#8B7355"
            strokeWidth="2"
            rx="5"
          />

          {/* Titre LÉGENDES */}
          <text
            x="240"
            y="730"
            textAnchor="middle"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '20px',
              fontWeight: 'bold',
              fill: '#333'
            }}
          >
            LÉGENDES
          </text>

          {/* Symbole fauteuil roulant */}
          <text x="50" y="770" style={{ fontFamily: 'Arial, sans-serif', fontSize: '24px' }}>♿</text>
          <text
            x="85"
            y="770"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              fill: '#333'
            }}
          >
            Résidents en fauteuils et qu'il faut remonter
          </text>

          {/* Symbole aide alimentaire */}
          <text x="50" y="805" style={{ fontFamily: 'Arial, sans-serif', fontSize: '24px' }}>🍴</text>
          <text
            x="85"
            y="805"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              fill: '#333'
            }}
          >
            Résidents ayant besoin d'aide alimentaire
          </text>

          {/* Symbole eau gélifiée */}
          <text x="50" y="840" style={{ fontFamily: 'Arial, sans-serif', fontSize: '24px' }}>💧</text>
          <text
            x="85"
            y="840"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              fill: '#333'
            }}
          >
            Eau gélifiée
          </text>

          {/* Symbole serviette */}
          <text x="50" y="875" style={{ fontFamily: 'Arial, sans-serif', fontSize: '24px' }}>🍽️</text>
          <text
            x="85"
            y="875"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              fill: '#333'
            }}
          >
            Résidents ayant besoin d'une serviette
          </text>

          {/* Service 1 */}
          <rect
            x="50"
            y="890"
            width={30}
            height={20}
            fill={service1Color}
            stroke="#8B7355"
            strokeWidth="2"
          />
          <text
            x="90"
            y="905"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              fill: '#333'
            }}
          >
            1er service
          </text>

          {/* Service 2 */}
          <rect
            x="50"
            y="920"
            width={30}
            height={20}
            fill={service2Color}
            stroke="#8B7355"
            strokeWidth="2"
          />
          <text
            x="90"
            y="935"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              fill: '#333'
            }}
          >
            2e service
          </text>
        </g>
      </svg>
    </Box>
  );
};

export default SeatingPlanTable;
