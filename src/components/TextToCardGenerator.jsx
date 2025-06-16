import React, { useState } from 'react';
import { Download, Plus, Trash2, FileText, Upload } from 'lucide-react';
import './TextToCardGenerator.css';

const TextToCardGenerator = () => {
  const [textList, setTextList] = useState(['']);
  const [fontSizes, setFontSizes] = useState([24]); // taille de police par défaut
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const addTextInput = () => {
    setTextList([...textList, '']);
    setFontSizes([...fontSizes, 24]);
  };

  const removeTextInput = (index) => {
    if (textList.length > 1) {
      const newList = textList.filter((_, i) => i !== index);
      const newFontSizes = fontSizes.filter((_, i) => i !== index);
      setTextList(newList);
      setFontSizes(newFontSizes);
    }
  };

  const updateText = (index, value) => {
    const newList = [...textList];
    newList[index] = value;
    setTextList(newList);
  };

  const updateFontSize = (index, value) => {
    const newSizes = [...fontSizes];
    newSizes[index] = Number(value);
    setFontSizes(newSizes);
  };

  // Fonction pour échapper les caractères spéciaux pour le SVG
  const escapeForSVG = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Nouvelle version de wrapText qui force le retour à la ligne même pour les mots trop longs
  const wrapText = (text, maxWidth, fontSize) => {
    const paragraphs = text.split('\n');
    const lines = [];
    const charWidth = fontSize * 0.6;
    const maxChars = Math.floor(maxWidth / charWidth);

    for (const paragraph of paragraphs) {
      let words = paragraph.split(' ');
      let currentLine = '';
      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        // Si le mot est trop long, on le coupe
        while (word.length > maxChars) {
          if (currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = '';
          }
          lines.push(word.slice(0, maxChars));
          word = word.slice(maxChars);
        }
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (testLine.length > maxChars) {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    return lines;
  };

  const generateSVG = (text, index) => {
    const width = 700;
    const height = 400;
    const border = 10;
    const radius = 28;
    const innerPadding = 24;
    const cardX = border;
    const cardY = border;
    const cardW = width - border * 2;
    const cardH = height - border * 2;
    const bgColor = '#e4e6eb';
    const maxTextW = cardW - innerPadding * 2;
    const maxTextH = cardH - innerPadding * 2 - 32;
    const fontSize = fontSizes[index] || 24;

    // Fonction pour calculer la taille de police optimale
    const findOptimalFontSize = (text, maxWidth, maxHeight) => {
      let bestFontSize = 12;
      let bestFit = 0;
      for (let size = 12; size <= 60; size += 1) {
        const lines = wrapText(text, maxWidth, size);
        const lineHeight = size * 1.4;
        const totalHeight = lines.length * lineHeight;
        if (totalHeight <= maxHeight) {
          const coverage = totalHeight / maxHeight;
          if (coverage > bestFit || size > bestFontSize) {
            bestFit = coverage;
            bestFontSize = size;
          }
        } else {
          break;
        }
      }
      return bestFontSize;
    };

    const optimalFontSize = findOptimalFontSize(text, maxTextW, maxTextH);
    const lines = wrapText(text, maxTextW, optimalFontSize);
    const lineHeight = optimalFontSize * 1.4;
    const totalTextHeight = lines.length * lineHeight;
    const startY = cardY + innerPadding + (maxTextH - totalTextHeight) / 2;

    // Fonction pour convertir le texte en SVG avec support du markdown
    const convertTextToSVG = (text) => {
      // Remplacer les marqueurs markdown par des balises SVG
      let svgText = escapeForSVG(text)
        .replace(/\*\*(.*?)\*\*/g, '<tspan font-weight="bold">$1</tspan>')
        .replace(/\*(.*?)\*/g, '<tspan font-style="italic">$1</tspan>');
      return svgText;
    };

    // SVG adapté à la nouvelle taille, texte aligné à gauche, fond gris dans la carte
    const svgContent = `
      <svg width="${width}" height="${height}" viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#fff" />
        <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="${radius}" ry="${radius}" fill="${bgColor}" stroke="#d80621" stroke-width="3" />
        <g font-family="Arial, sans-serif" font-size="${fontSize}" fill="#222">
          ${lines.map((line, i) => `<text x="${cardX + innerPadding}" y="${startY + (i * lineHeight)}" dominant-baseline="hanging">${convertTextToSVG(line)}</text>`).join('')}
        </g>
        <text x="${cardX + cardW - innerPadding}" y="${cardY + cardH - 16}" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#d80621" text-anchor="end">www.prepartcfcanada.fr</text>
      </svg>
    `;

    return svgContent;
  };

  const downloadCard = async (text, index) => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    try {
      const svgContent = generateSVG(text, index);
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question-${index + 1}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAllCards = async () => {
    const validTexts = textList.filter(text => text.trim());
    if (validTexts.length === 0) return;

    setIsGenerating(true);
    
    for (let i = 0; i < validTexts.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const svgContent = generateSVG(validTexts[i], i);
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question-${i + 1}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    setIsGenerating(false);
  };

  const extractTextsFromImport = () => {
    // Expression régulière pour trouver les textes entre guillemets
    const regex = /Texte : "([^"]+)"/g;
    const matches = [...importText.matchAll(regex)];
    
    if (matches.length > 0) {
      const extractedTexts = matches.map(match => {
        // Nettoyer le texte : remplacer les sauts de ligne par des espaces et supprimer les espaces multiples
        return match[1]
          .replace(/\n/g, ' ')  // Remplacer les sauts de ligne par des espaces
          .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul espace
          .trim();              // Supprimer les espaces au début et à la fin
      });
      setTextList(extractedTexts);
      setFontSizes(new Array(extractedTexts.length).fill(24));
      setShowImportModal(false);
      setImportText('');
    } else {
      alert('Aucun texte entre guillemets trouvé dans le texte importé.');
    }
  };

  return (
    <div className="text-card-generator-container">
      <div className="tcg-header">
        <div className="tcg-header-icon">
          <FileText size={32} />
        </div>
        <div>
          <h1 className="tcg-title">Générateur de Cartes Texte</h1>
          <div className="tcg-subtitle">Créez des cartes élégantes à partir de votre texte</div>
        </div>
      </div>

      {/* Bouton d'import */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setShowImportModal(true)}
          className="tcg-btn tcg-btn-blue"
        >
          <Upload size={20} /> Importer depuis texte
        </button>
      </div>

      {/* Modal d'import */}
      {showImportModal && (
        <div className="tcg-modal-overlay">
          <div className="tcg-modal">
            <h2>Importer des textes</h2>
            <p>Collez votre texte contenant les questions. Les textes entre guillemets seront automatiquement extraits.</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Collez votre texte ici..."
              style={{ width: '100%', height: '300px', margin: '20px 0' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowImportModal(false)}
                className="tcg-btn tcg-btn-red"
              >
                Annuler
              </button>
              <button
                onClick={extractTextsFromImport}
                className="tcg-btn tcg-btn-green"
              >
                Extraire les textes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="tcg-card-list">
        {textList.map((text, index) => (
          <div key={index} className="tcg-card">
            <div className="tcg-card-row">
              <div style={{ flex: 1 }}>
                <label>Texte {index + 1}</label>
                <textarea
                  value={text}
                  onChange={(e) => updateText(index, e.target.value)}
                  placeholder="Entrez votre texte ici..."
                  style={{ width: '400px', height: '200px' }}
                />
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 13, color: '#555' }}>Taille du texte :</label>
                  <input
                    type="number"
                    min={12}
                    max={60}
                    value={fontSizes[index]}
                    onChange={e => updateFontSize(index, e.target.value)}
                    style={{ width: 60, padding: 4, borderRadius: 6, border: '1px solid #ccc' }}
                  />
                  <span style={{ fontSize: 13, color: '#888' }}>px</span>
                </div>
              </div>
              <div className="tcg-card-actions">
                <button
                  onClick={() => downloadCard(text, index)}
                  disabled={!text.trim() || isGenerating}
                  className="tcg-btn tcg-btn-green"
                >
                  <Download size={16} /> Télécharger
                </button>
                {textList.length > 1 && (
                  <button
                    onClick={() => removeTextInput(index)}
                    className="tcg-btn tcg-btn-red"
                  >
                    <Trash2 size={16} /> Supprimer
                  </button>
                )}
              </div>
              {/* Aperçu SVG */}
              <div className="tcg-preview-box">
                {text.trim() ? (
                  <div
                    className="tcg-preview-svg-wrapper"
                    dangerouslySetInnerHTML={{
                      __html: generateSVG(text, index)
                    }}
                  />
                ) : (
                  <div className="tcg-preview-placeholder">Aperçu…</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button
          onClick={addTextInput}
          className="tcg-btn tcg-btn-blue"
        >
          <Plus size={20} /> Ajouter un texte
        </button>
        <button
          onClick={downloadAllCards}
          disabled={textList.filter(t => t.trim()).length === 0 || isGenerating}
          className="tcg-btn tcg-btn-purple"
        >
          <Download size={20} /> {isGenerating ? 'Génération...' : 'Télécharger toutes les cartes'}
        </button>
      </div>
      <div className="tcg-info-box">
        <strong>Informations :</strong>
        <ul>
          <li>• Les cartes générées ont une taille de 700x400 pixels</li>
          <li>• Le texte s'adapte automatiquement pour occuper tout l'espace disponible</li>
          <li>• Format de téléchargement : SVG</li>
          <li>• Chaque carte est numérotée automatiquement</li>
          <li>• Police adaptative selon la longueur du texte</li>
        </ul>
      </div>
    </div>
  );
};

export default TextToCardGenerator; 