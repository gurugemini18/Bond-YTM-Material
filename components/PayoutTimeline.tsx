import React, { useMemo, useState, useEffect } from 'react';
import { BondInputState, PayoutDataPoint } from '../types';

interface PayoutTimelineProps {
    bondInputs: BondInputState;
    quantity: number;
}

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
    <span className="material-symbols-outlined" style={{ transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
);

const PayoutTimeline: React.FC<PayoutTimelineProps> = ({ bondInputs, quantity }) => {
    const payoutData: PayoutDataPoint[] = useMemo(() => {
        const { maturityDate, faceValue, couponRate, couponFrequency } = bondInputs;
        if (!maturityDate || couponFrequency <= 0 || !isFinite(faceValue) || !isFinite(couponRate) || !isFinite(quantity) || quantity <= 0) {
            return [];
        }

        const maturity = new Date(maturityDate + 'T00:00:00'); 
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (maturity <= today) {
            return [];
        }

        const monthsBetweenPayments = 12 / couponFrequency;
        const couponPaymentAmount = (faceValue * (couponRate / 100)) / couponFrequency;

        const paymentDates: Date[] = [];
        let currentPaymentDate = new Date(maturity);

        while (currentPaymentDate > today) {
            paymentDates.unshift(new Date(currentPaymentDate)); 
            currentPaymentDate.setMonth(currentPaymentDate.getMonth() - monthsBetweenPayments);
        }
        
        if (paymentDates.length === 0) {
             return [{
                payoutDate: maturity,
                interest: 0,
                principal: faceValue * quantity,
            }];
        }

        return paymentDates.map((date) => {
            const isFinalPayment = date.getTime() === maturity.getTime();
            return {
                payoutDate: date,
                interest: couponPaymentAmount * quantity,
                principal: isFinalPayment ? faceValue * quantity : 0,
            };
        });

    }, [bondInputs, quantity]);

    const payoutsByYear = useMemo(() => {
        return payoutData.reduce((acc, payout) => {
            const year = payout.payoutDate.getFullYear().toString();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(payout);
            return acc;
        }, {} as Record<string, PayoutDataPoint[]>);
    }, [payoutData]);

    const years = useMemo(() => Object.keys(payoutsByYear).sort((a, b) => parseInt(a) - parseInt(b)), [payoutsByYear]);
    const [openYear, setOpenYear] = useState<string | null>(null);

    useEffect(() => {
        if (years.length > 0 && openYear === null) {
            setOpenYear(years[0]);
        } else if (years.length === 0) {
            setOpenYear(null);
        }
    }, [years, openYear]);


    if (years.length === 0) {
        return <p style={{textAlign: 'center', padding: '2rem 0', color: 'var(--md-sys-color-on-surface-variant)'}}>No future payouts to display for the selected maturity date.</p>;
    }

    const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="container-y-spacing-sm">
            {years.map((year) => {
                const isOpen = openYear === year;
                const yearlyPayouts = payoutsByYear[year];
                const yearlyTotal = yearlyPayouts.reduce((sum, p) => sum + p.interest + p.principal, 0);

                return (
                    <div key={year} className="accordion-item">
                        <div
                            className="collapsible-header card-padding-sm"
                            style={{backgroundColor: 'var(--md-sys-color-surface-container-high)'}}
                            onClick={() => setOpenYear(isOpen ? null : year)}
                            aria-expanded={isOpen}
                            aria-controls={`payouts-${year}`}
                        >
                             <span className="font-semibold text-lg" style={{color: 'var(--md-sys-color-on-surface)'}}>{`Year ${year}`}</span>
                            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                <span className="font-medium" style={{color: 'var(--md-sys-color-on-surface-variant)'}}>{formatCurrency(yearlyTotal)}</span>
                                <ChevronIcon open={isOpen} />
                            </div>
                        </div>
                        <div
                            id={`payouts-${year}`}
                            className={`collapsible-content ${isOpen ? 'is-open' : ''}`}
                        >
                           <div>
                               <md-list>
                                    <div className="payout-grid-header">
                                       <div>Date</div>
                                       <div>Interest</div>
                                       <div>Principal</div>
                                       <div>Total Payout</div>
                                    </div>
                                    {yearlyPayouts.map((payout, index) => (
                                         <md-list-item key={index}>
                                            <div className="payout-grid-row">
                                                <div className="text-sm font-medium" style={{color: 'var(--md-sys-color-on-surface)'}}>
                                                    {payout.payoutDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </div>
                                                <div className="text-sm" style={{color: 'var(--md-sys-color-on-surface-variant)'}}>{formatCurrency(payout.interest)}</div>
                                                <div className="text-sm" style={{color: 'var(--md-sys-color-on-surface-variant)'}}>{formatCurrency(payout.principal)}</div>
                                                <div className="text-sm font-semibold" style={{color: 'var(--md-sys-color-on-surface)'}}>{formatCurrency(payout.interest + payout.principal)}</div>
                                            </div>
                                         </md-list-item>
                                    ))}
                               </md-list>
                           </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PayoutTimeline;