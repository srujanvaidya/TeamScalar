'use client';

export default function IndiaDotMap() {
  // Matrix grid of dots forming India silhouette coordinates [x, y]
  const INDIA_DOTS = [
    // Kashmir & North
    [150, 40], [160, 30], [170, 20], [180, 25], [190, 35], [175, 45], [165, 55], [155, 65],
    [145, 75], [160, 70], [175, 65], [185, 60], [195, 65], [205, 70],
    // Northwest & Punjab/Rajasthan
    [130, 90], [140, 85], [150, 95], [135, 110], [125, 125], [135, 135], [145, 120], [155, 110],
    [165, 100], [175, 95], [185, 90], [195, 95], [205, 100], [215, 105],
    // West & Gujarat / Coastline
    [115, 145], [105, 160], [100, 175], [110, 185], [120, 170], [130, 160], [140, 150], [150, 140],
    [160, 130], [170, 120], [180, 115], [190, 110], [200, 115], [210, 120], [220, 125],
    // Central India
    [160, 150], [175, 145], [190, 140], [205, 135], [220, 140], [235, 145], [250, 150],
    [150, 175], [165, 165], [180, 160], [195, 155], [210, 150], [225, 155], [240, 160], [255, 165],
    // Peninsular South (Deccan / Maharashtra / Goa / Karnataka / Kerala / TN)
    [135, 200], [145, 190], [155, 180], [170, 185], [185, 175], [200, 170], [215, 175], [230, 180], [245, 185], [260, 180],
    [140, 220], [150, 210], [165, 205], [180, 200], [195, 195], [210, 190], [225, 195], [240, 200], [250, 210], [255, 220],
    [145, 240], [155, 230], [170, 225], [185, 220], [200, 215], [215, 220], [230, 225], [245, 235], [250, 245],
    [150, 260], [160, 250], [175, 245], [190, 240], [205, 235], [220, 240], [235, 250], [240, 265],
    [160, 280], [170, 270], [185, 265], [200, 260], [215, 265], [225, 275], [230, 285],
    [170, 300], [180, 290], [195, 285], [210, 280], [220, 295],
    [180, 320], [190, 310], [205, 305], [215, 315],
    [190, 340], [200, 330], [210, 335],
    [195, 355], [205, 350], // Cape Comorin / Kanyakumari Tip
    // East / Bengal & North East
    [265, 130], [275, 125], [285, 120], [295, 125], [305, 130], [315, 125], [325, 120],
    [270, 145], [280, 140], [290, 135], [300, 140], [310, 145], [320, 140], [330, 135],
    [265, 160], [275, 155], [285, 150], [295, 155], [305, 160],
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="360" height="380" viewBox="0 0 360 380" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ambient Glow Aura */}
        <circle cx="195" cy="190" r="150" fill="url(#glowGradient)" opacity="0.12" />

        {/* Matrix Dot Grid for India Map Silhouette */}
        {INDIA_DOTS.map(([x, y], idx) => {
          const isMajorHub = idx % 9 === 0;
          return (
            <g key={idx}>
              <circle
                cx={x}
                cy={y}
                r={isMajorHub ? 3.5 : 2}
                fill={isMajorHub ? '#167e6c' : '#111a4a'}
                opacity={isMajorHub ? 0.9 : 0.45}
              />
              {isMajorHub && (
                <circle cx={x} cy={y} r="7" stroke="#167e6c" strokeWidth="0.8" opacity="0.3" className="animate-pulse" />
              )}
            </g>
          );
        })}

        {/* Animated Trade Arcs Across India Coastal Corridor */}
        <path
          d="M 100 175 Q 150 240 195 355"
          stroke="#44b48b"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.6"
        />
        <path
          d="M 195 355 Q 240 260 270 145"
          stroke="#ec652b"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.6"
        />

        {/* Node Labels for Indian Logistics Ports */}
        <text x="75" y="180" fill="#111a4a" fontSize="9" fontFamily="monospace" fontWeight="bold">JNPT MUMBAI</text>
        <text x="210" y="360" fill="#167e6c" fontSize="9" fontFamily="monospace" fontWeight="bold">COCHIN PORT</text>
        <text x="278" y="148" fill="#111a4a" fontSize="9" fontFamily="monospace" fontWeight="bold">KOLKATA PORT</text>

        <defs>
          <radialGradient id="glowGradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(195 190) scale(150)">
            <stop stopColor="#167e6c" />
            <stop offset="1" stopColor="#111a4a" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
