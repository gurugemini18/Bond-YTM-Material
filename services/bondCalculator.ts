import { BondDetails, YtmResult } from '../types';

const MAX_ITERATIONS = 100;
const PRECISION = 1e-7;

function calculateBondPrice(rate: number, bond: BondDetails, periods: number): number {
  const { faceValue, couponRate, couponFrequency } = bond;
  const couponPayment = (faceValue * (couponRate / 100)) / couponFrequency;

  if (Math.abs(rate) < PRECISION) {
    return (couponPayment * periods) + faceValue;
  }
  
  if (rate <= -1) return Infinity;

  const couponPV = couponPayment * ((1 - Math.pow(1 + rate, -periods)) / rate);
  const faceValuePV = faceValue / Math.pow(1 + rate, periods);
  
  return couponPV + faceValuePV;
}

export function calculateYTM(bond: BondDetails): YtmResult | null {
    const { marketPrice, faceValue, couponRate, yearsToMaturity, couponFrequency } = bond;
    
    if (!isFinite(faceValue) || !isFinite(marketPrice) || !isFinite(couponRate) || !isFinite(yearsToMaturity) || !isFinite(couponFrequency)) {
        return null;
    }

    const periods = Math.round(yearsToMaturity * couponFrequency);

    if (periods <= 0 || marketPrice <= 0 || yearsToMaturity <= 0) {
        return null;
    }

    const annualCouponPayment = faceValue * (couponRate / 100);
    const currentYield = annualCouponPayment / marketPrice;

    if (couponRate === 0) {
        if (marketPrice > faceValue) return null;
        const ytmPeriodic = Math.pow(faceValue / marketPrice, 1 / periods) - 1;
        const ytmAnnual = ytmPeriodic * couponFrequency;
        const ytmEffectiveAnnual = Math.pow(1 + ytmPeriodic, couponFrequency) - 1;
        const totalReturn = faceValue - marketPrice;
        const returnOnInvestment = totalReturn / marketPrice;
        
        return {
            ytmPeriodic, ytmAnnual, ytmEffectiveAnnual,
            totalReturn, returnOnInvestment, currentYield, totalCouponPayments: 0
        };
    }
    
    let low = -0.9999;
    let high = 5.0;
    let mid = 0;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        mid = (low + high) / 2;
        if (mid === low || mid === high) break;

        const calculatedPrice = calculateBondPrice(mid, bond, periods);
        
        if (Math.abs(calculatedPrice - marketPrice) < PRECISION) break;

        if (calculatedPrice > marketPrice) low = mid;
        else high = mid;
    }
    
    if (Math.abs(calculateBondPrice(mid, bond, periods) - marketPrice) >= PRECISION * 10) {
       return null;
    }

    const ytmPeriodic = mid;
    const ytmAnnual = ytmPeriodic * couponFrequency;
    const ytmEffectiveAnnual = Math.pow(1 + ytmPeriodic, couponFrequency) - 1;
    
    const couponPayment = annualCouponPayment / couponFrequency;
    const totalCouponPayments = couponPayment * periods;
    const totalReturn = (totalCouponPayments + faceValue) - marketPrice;
    const returnOnInvestment = totalReturn / marketPrice;
    
    return {
        ytmPeriodic, ytmAnnual, ytmEffectiveAnnual,
        totalReturn, returnOnInvestment, currentYield, totalCouponPayments
    };
}