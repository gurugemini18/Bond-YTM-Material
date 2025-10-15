import React, { useState, useEffect, useMemo } from 'react';
import { BondDetails, YtmResult, CouponFrequencyOptions, BondInputState, BondSearchResult } from '../types';
import { calculateYTM } from '../services/bondCalculator';
import PayoutTimeline from './PayoutTimeline';
import BondSearch from './BondSearch';

interface YtmCalculatorProps {
    bondInputs: BondInputState;
    setBondInputs: React.Dispatch<React.SetStateAction<BondInputState>>;
}

const InfoIcon: React.FC = () => (
     <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--md-sys-color-on-surface-variant)', verticalAlign: 'middle', marginLeft: '4px', cursor: 'help' }}>help</span>
);

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
    <span className="material-symbols-outlined" style={{ transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
);

const DetailRow: React.FC<{ label: string; value?: string; description?: string; children?: React.ReactNode; info?: boolean }> = ({ label, value, description, info, children }) => (
    <div style={{ marginBottom: description ? '0' : '8px' }}>
        <div className="detail-row">
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>{label} {info && <InfoIcon />}</p>
            {children || <p style={{ fontWeight: '500', color: 'var(--md-sys-color-on-surface)', margin: 0 }}>{value}</p>}
        </div>
        {description && <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '-4px', paddingBottom: '8px', maxWidth: '24rem' }}>{description}</p>}
    </div>
);

const YtmCalculator: React.FC<YtmCalculatorProps> = ({ bondInputs, setBondInputs }) => {
    const [quantity, setQuantity] = useState(1);
    const [isReceivableOpen, setIsReceivableOpen] = useState(true);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    
    const [result, setResult] = useState<YtmResult | null>(null);

    useEffect(() => {
        const maturityTime = new Date(bondInputs.maturityDate).getTime();
        const nowTime = new Date().getTime();
        const yearsToMaturity = (maturityTime - nowTime) / (1000 * 60 * 60 * 24 * 365.25);

        if (yearsToMaturity > 0) {
            const newBondDetails: BondDetails = {
                faceValue: bondInputs.faceValue,
                marketPrice: bondInputs.marketPrice,
                couponRate: bondInputs.couponRate,
                couponFrequency: bondInputs.couponFrequency,
                yearsToMaturity: yearsToMaturity,
            };
            const calculatedResult = calculateYTM(newBondDetails);
            setResult(calculatedResult);
        } else {
            setResult(null);
        }
    }, [bondInputs]);

    const maturityDuration = useMemo(() => {
        if (!bondInputs.maturityDate) return '';
        
        const maturityDate = new Date(bondInputs.maturityDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (maturityDate < today) {
            return "Matured";
        }
        if (maturityDate.getTime() === today.getTime()){
            return "Matures Today";
        }

        let years = maturityDate.getFullYear() - today.getFullYear();
        let months = maturityDate.getMonth() - today.getMonth();
        let days = maturityDate.getDate() - today.getDate();

        if (days < 0) {
            months--;
            const prevMonthLastDay = new Date(maturityDate.getFullYear(), maturityDate.getMonth(), 0).getDate();
            days += prevMonthLastDay;
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        const parts = [];
        if (years > 0) parts.push(`${years} ${years > 1 ? 'yrs' : 'yr'}`);
        if (months > 0) parts.push(`${months} ${months > 1 ? 'mos' : 'mo'}`);
        if (days > 0) parts.push(`${days} ${days > 1 ? 'days' : 'day'}`);
        
        return parts.join(', ');
    }, [bondInputs.maturityDate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | Event) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement;
        const { name, value, type } = target;
        const parsedValue = type === 'number' && value !== '' ? parseFloat(value) : value;
        setBondInputs(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (value >= 1) {
            setQuantity(value);
        } else {
            setQuantity(1);
        }
    };
    
    const handleBondSelect = (bond: BondSearchResult) => {
        if (!bond) return;

        const parseNumericInput = (value: any, defaultValue: number): number => {
            if (value === null || typeof value === 'undefined') return defaultValue;
            const num = parseFloat(value);
            return isNaN(num) ? defaultValue : num;
        };

        setBondInputs(prev => ({
            ...prev,
            faceValue: parseNumericInput(bond.faceValue, prev.faceValue),
            marketPrice: parseNumericInput(bond.marketPrice, prev.marketPrice),
            couponRate: parseNumericInput(bond.couponRate, prev.couponRate),
            couponFrequency: parseNumericInput(bond.couponFrequency, prev.couponFrequency),
            maturityDate: (bond.maturityDate && typeof bond.maturityDate === 'string') ? bond.maturityDate : prev.maturityDate,
        }));
        setIsAdvancedOpen(true);
    };

    const displayValues = useMemo(() => {
        if (!result) return { amountToInvest: 0, totalCouponPayments: 0, tdsAmount: 0, maturityAmount: 0, totalReceivable: 0, preTaxProfit: 0, postTaxProfit: 0, monthlyRate: 0 };
        
        const amountToInvest = bondInputs.marketPrice * quantity;
        const totalCouponPayments = result.totalCouponPayments * quantity;
        const tdsAmount = totalCouponPayments * (bondInputs.tdsRate / 100);
        const maturityAmount = bondInputs.faceValue * quantity;
        const totalReceivable = (totalCouponPayments - tdsAmount) + maturityAmount;
        
        const preTaxProfit = (totalCouponPayments + maturityAmount) - amountToInvest;
        const postTaxProfit = totalReceivable - amountToInvest;
        
        const monthlyRate = (Math.pow(1 + result.ytmEffectiveAnnual, 1/12) - 1);

        return { amountToInvest, totalCouponPayments, tdsAmount, maturityAmount, totalReceivable, preTaxProfit, postTaxProfit, monthlyRate };
    }, [result, quantity, bondInputs]);
    
    const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="container-y-spacing">
            <div className="calculator-layout">
                <div className="calculator-sidebar">
                    <md-filled-card style={{'--md-filled-card-container-color': 'var(--md-sys-color-surface-container)'}}>
                        <div className="p-5 space-y-4">
                            <h2 className="text-xl font-bold" style={{color: 'var(--md-sys-color-on-surface)'}}>Order Details</h2>
            
                            <div>
                                <DetailRow label="Amount to Invest" value={formatCurrency(displayValues.amountToInvest)} info />
                                <DetailRow label="Ask Rate (Annual)" value={result ? `${(result.ytmAnnual * 100).toFixed(2)}% p.a.` : 'N/A'} />
                                <DetailRow label="Ask Rate (Monthly)" value={result ? `${(displayValues.monthlyRate * 100).toFixed(2)}% p.m.` : 'N/A'} />
                                <DetailRow label="Maturing on">
                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right'}}>
                                        <input
                                            type="date"
                                            name="maturityDate"
                                            value={bondInputs.maturityDate}
                                            onChange={handleInputChange}
                                            className="font-semibold bg-transparent text-right focus:outline-none"
                                            style={{color: 'var(--md-sys-color-on-surface)'}}
                                            aria-label="Maturity Date"
                                        />
                                        {maturityDuration && <p style={{fontSize: '0.75rem', marginTop: '4px', color: 'var(--md-sys-color-on-surface-variant)'}}>{maturityDuration}</p>}
                                    </div>
                                </DetailRow>
                            </div>

                            <md-divider></md-divider>

                            <div>
                                <div className="collapsible-header" onClick={() => setIsReceivableOpen(!isReceivableOpen)}>
                                    <span className="font-semibold" style={{color: 'var(--md-sys-color-primary)'}}>Total Amount receivable</span>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <span className="font-bold" style={{color: 'var(--md-sys-color-on-surface)'}}>{formatCurrency(displayValues.totalReceivable)}</span>
                                        <ChevronIcon open={isReceivableOpen} />
                                    </div>
                                </div>
                                <div className={`collapsible-content ${isReceivableOpen ? 'is-open' : ''}`}>
                                    <div>
                                        <div className="mt-4 pl-2 border-l-2 space-y-2" style={{borderColor: 'var(--md-sys-color-outline-variant)'}}>
                                            <DetailRow label="Coupon Payments" value={formatCurrency(displayValues.totalCouponPayments)} description="Bond coupon payments with TDS deducted to be credited directly to your bank account." />
                                            <DetailRow label={`${bondInputs.tdsRate}% TDS`} value={formatCurrency(displayValues.tdsAmount)} description={`The issuer will withhold ${bondInputs.tdsRate}% Tax Deducted at Source (TDS) from the coupon payment amount.`} />
                                            <DetailRow label="Maturity Amount" value={formatCurrency(displayValues.maturityAmount)} description="Amount the investor will receive on the maturity date." />
                                            <DetailRow label="Pre-tax Profit" value={formatCurrency(displayValues.preTaxProfit)} description="The total gain on your investment before tax deductions (Total Coupons + Maturity Amount - Amount to Invest)." />
                                            <DetailRow label="Post-tax Profit" value={formatCurrency(displayValues.postTaxProfit)} description="The total gain after TDS deduction (Pre-tax Profit - TDS Amount)." />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <md-divider></md-divider>

                            <div>
                                <DetailRow label="Quantity">
                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <md-icon-button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}><span className="material-symbols-outlined">remove</span></md-icon-button>
                                        <md-filled-text-field
                                            type="number"
                                            value={String(quantity)}
                                            onInput={handleQuantityInputChange}
                                            min="1"
                                            aria-label="Quantity"
                                            style={{width: '80px', textAlign: 'center'}}
                                        />
                                        <md-icon-button onClick={() => setQuantity(q => q + 1)}><span className="material-symbols-outlined">add</span></md-icon-button>
                                    </div>
                                </DetailRow>
                            </div>
                        </div>
                    </md-filled-card>
                </div>

                <div className="calculator-main container-y-spacing">
                    <md-filled-card style={{'--md-filled-card-container-color': 'var(--md-sys-color-surface-container)'}}>
                        <div className="p-5">
                            <BondSearch onBondSelect={handleBondSelect} />
                        </div>
                    </md-filled-card>

                    <md-outlined-card>
                         <div
                            className="collapsible-header card-padding"
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            aria-expanded={isAdvancedOpen}
                            aria-controls="advanced-settings"
                        >
                            <h3 className="text-lg font-bold" style={{color: 'var(--md-sys-color-on-surface)'}}>Advanced Settings</h3>
                            <ChevronIcon open={isAdvancedOpen} />
                        </div>
                        <div
                            id="advanced-settings"
                            className={`collapsible-content ${isAdvancedOpen ? 'is-open' : ''}`}
                        >
                            <div>
                                <md-divider></md-divider>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm" style={{color: 'var(--md-sys-color-on-surface-variant)'}}>Manually adjust the bond parameters below to see how it affects the yield and returns.</p>
                                    <md-filled-text-field label="Investment Amount (per unit)" name="marketPrice" type="number" value={String(bondInputs.marketPrice)} onInput={handleInputChange} style={{width: '100%'}} />
                                    <md-filled-text-field label="Face Value (per unit)" name="faceValue" type="number" value={String(bondInputs.faceValue)} onInput={handleInputChange} style={{width: '100%'}} />
                                    <md-filled-text-field label="Annual Coupon Rate (%)" name="couponRate" type="number" step="0.01" min="0" value={String(bondInputs.couponRate)} onInput={handleInputChange} style={{width: '100%'}} />
                                    <md-filled-select label="Coupon Frequency" name="couponFrequency" value={String(bondInputs.couponFrequency)} onInput={handleInputChange} style={{width: '100%'}}>
                                        {CouponFrequencyOptions.map(opt => <md-select-option key={opt.value} value={String(opt.value)}>{opt.label}</md-select-option>)}
                                    </md-filled-select>
                                    <md-filled-text-field label="TDS Rate (%)" name="tdsRate" type="number" min="0" value={String(bondInputs.tdsRate)} onInput={handleInputChange} style={{width: '100%'}} />
                                </div>
                            </div>
                        </div>
                    </md-outlined-card>
                </div>
            </div>
            
            <md-filled-card style={{'--md-filled-card-container-color': 'var(--md-sys-color-surface-container)'}}>
                 <div className="p-5">
                    <h2 className="text-xl font-bold mb-4" style={{color: 'var(--md-sys-color-on-surface)'}}>Payout Schedule</h2>
                    <PayoutTimeline bondInputs={bondInputs} quantity={quantity} />
                </div>
            </md-filled-card>
        </div>
    );
};

export default YtmCalculator;