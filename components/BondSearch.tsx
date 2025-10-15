import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BondSearchResult } from '../types';

interface BondSearchProps {
    onBondSelect: (bond: BondSearchResult) => void;
}

const LoadingSpinner: React.FC = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
        <md-circular-progress indeterminate></md-circular-progress>
    </div>
);

const BondSearch: React.FC<BondSearchProps> = ({ onBondSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [maturityYear, setMaturityYear] = useState('');
    const [results, setResults] = useState<BondSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setError('Please enter a search term.');
            return;
        }

        setIsSearching(true);
        setError(null);
        setResults([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const prompt = `You are a financial data service. Find bond details for "${searchTerm}" maturing around ${maturityYear || 'any year'}. Use Google Search for the most up-to-date information.
Return a JSON array of objects with the following keys: "isin", "name", "faceValue", "marketPrice", "couponRate", "couponFrequency" (1 for annual, 2 for semi-annual, 4 for quarterly, 12 for monthly), and "maturityDate" (in "YYYY-MM-DD" format).
If you cannot find a value, use a reasonable default or null. Ensure the response is ONLY the JSON array inside a JSON code block. Example:
\`\`\`json
[
  {
    "isin": "INE020B08AL0",
    "name": "REC 8.75 2024",
    "faceValue": 1000,
    "marketPrice": 1001.5,
    "couponRate": 8.75,
    "couponFrequency": 1,
    "maturityDate": "2024-12-21"
  }
]
\`\`\`
`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{googleSearch: {}}],
                },
            });
            
            const textResponse = response.text;
            if (textResponse) {
                const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
                
                if (jsonMatch && jsonMatch[1]) {
                    const parsedResults = JSON.parse(jsonMatch[1]);
                    if (Array.isArray(parsedResults) && parsedResults.length > 0) {
                         setResults(parsedResults);
                    } else {
                        setError('No bonds found matching your criteria.');
                    }
                } else {
                    setError('Could not parse bond data from the response. Please try again.');
                }
            } else {
                setError('Received an empty response. Please try a different search.');
            }

        } catch (err) {
            console.error('Error fetching bond details:', err);
            setError('An error occurred while fetching bond details. Please check your connection and try again.');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold" style={{color: 'var(--md-sys-color-on-surface)'}}>Find a Bond</h2>
            <form onSubmit={handleSearch} className="space-y-4">
                <div className="search-form-grid">
                    <div className="search-form-grid__item--span-2">
                        <md-filled-text-field
                            label="ISIN or Bond Name"
                            id="searchTerm"
                            type="text"
                            value={searchTerm}
                            onInput={(e: any) => setSearchTerm(e.target.value)}
                            placeholder="e.g., IN0020180017"
                            style={{width: '100%'}}
                        />
                    </div>
                    <div>
                        <md-filled-text-field
                            label="Maturity Year"
                            id="maturityYear"
                            type="number"
                            value={maturityYear}
                            onInput={(e: any) => setMaturityYear(e.target.value)}
                            placeholder="e.g., 2028"
                            min="1900"
                            max="2100"
                            style={{width: '100%'}}
                        />
                    </div>
                </div>
                <md-filled-button type="submit" disabled={isSearching} style={{width: '100%'}}>
                    {isSearching ? 'Searching...' : 'Search'}
                </md-filled-button>
            </form>
            <div style={{marginTop: '1rem'}}>
                {isSearching && <LoadingSpinner />}
                {error && <p className="error-message">{error}</p>}
                {results.length > 0 && (
                    <div className="search-results-container">
                        <h3 className="text-base font-semibold" style={{color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '0.75rem'}}>Search Results</h3>
                        <md-list>
                            {results.map((bond) => (
                                <md-list-item key={bond.isin}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                                        <div>
                                            <p className="font-bold text-sm" style={{color: 'var(--md-sys-color-on-surface)'}}>{bond.name}</p>
                                            <p className="text-xs" style={{color: 'var(--md-sys-color-on-surface-variant)'}}>{bond.isin} &bull; Matures {new Date(bond.maturityDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                        </div>
                                        <md-tonal-button onClick={() => onBondSelect(bond)} slot="end">Select</md-tonal-button>
                                    </div>
                                </md-list-item>
                            ))}
                        </md-list>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BondSearch;