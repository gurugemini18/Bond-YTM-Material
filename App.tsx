import { useState } from 'react';
import YtmCalculator from './components/YtmCalculator';
import { BondInputState } from './types';


function App() {
  const [bondInputs, setBondInputs] = useState<BondInputState>({
    faceValue: 1000,
    marketPrice: 994,
    couponRate: 9,
    couponFrequency: 12,
    maturityDate: '2026-01-01',
    tdsRate: 10,
  });

  let formattedMaturityDate = 'N/A';
  if (bondInputs.maturityDate && typeof bondInputs.maturityDate === 'string') {
    const parts = bondInputs.maturityDate.split('-').map(p => parseInt(p, 10));
    if (parts.length === 3 && !parts.some(isNaN)) {
      const maturityDateUTC = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      if (!isNaN(maturityDateUTC.getTime())) {
        const day = maturityDateUTC.getUTCDate();
        const month = maturityDateUTC.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase();
        const year = maturityDateUTC.getUTCFullYear().toString().slice(-2);
        formattedMaturityDate = `${day}-${month}-${year}`;
      }
    }
  }

  const headerSubText = `${bondInputs.couponRate}% BOND ${formattedMaturityDate}`;

  return (
    <div>
      <md-top-app-bar>
        <md-icon-button slot="navigation" aria-label="Go back">
          <span className="material-symbols-outlined">arrow_back</span>
        </md-icon-button>
        <div slot="title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>BOND INVESTMENT</span>
                <md-chip label="LIVE" elevated></md-chip>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, marginTop: '2px' }}>
                {headerSubText}
            </p>
        </div>
      </md-top-app-bar>
      
      <main className="main-content" style={{paddingTop: '80px'}}>
        <div className="content-wrapper">
          <YtmCalculator bondInputs={bondInputs} setBondInputs={setBondInputs} />
        </div>
      </main>
    </div>
  );
}

export default App;