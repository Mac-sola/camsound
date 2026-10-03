/**
 * Payment Gateway Factory
 * 
 * Reads the PAYMENT_GATEWAY env var to decide which gateway implementation to use.
 * 
 * Supported values:
 *   - "simulated" (default) — for dev/demo, always succeeds
 *   - "campay"    — Campay (campay.net) — implement CampayGateway
 *   - "fapshi"    — Fapshi (fapshi.com) — implement FapshiGateway
 *   - "nkwapay"   — Nkwa Pay (nkwapay.com) — implement NkwaPayGateway
 *   - "chokopay"  — ChokoPay (chokopay.com) — implement ChokoPayGateway
 * 
 * To add a new gateway:
 *   1. Create a class implementing PaymentGateway interface
 *   2. Add a case for it in the switch below
 *   3. Set PAYMENT_GATEWAY=<name> in your .env
 */

import { PaymentGateway } from './paymentGateway';
import { SimulatedGateway } from './simulatedGateway';

// Singleton cache
let _gateway: PaymentGateway | null = null;

export function getPaymentGateway(): PaymentGateway {
    if (_gateway) return _gateway;

    const provider = (process.env.PAYMENT_GATEWAY || 'simulated').toLowerCase().trim();

    switch (provider) {
        case 'simulated':
        case 'demo':
        case 'test':
            _gateway = new SimulatedGateway();
            break;

        // ─── Future Real Gateways ───
        // Uncomment and implement when ready:
        //
        // case 'campay':
        //     _gateway = new CampayGateway();
        //     break;
        //
        // case 'fapshi':
        //     _gateway = new FapshiGateway();
        //     break;
        //
        // case 'nkwapay':
        //     _gateway = new NkwaPayGateway();
        //     break;
        //
        // case 'chokopay':
        //     _gateway = new ChokoPayGateway();
        //     break;

        default:
            console.warn(`[PaymentGateway] Unknown provider "${provider}", falling back to simulated`);
            _gateway = new SimulatedGateway();
            break;
    }

    console.log(`[PaymentGateway] Initialized: ${_gateway.name} (simulated: ${_gateway.isSimulated})`);
    return _gateway;
}

/**
 * Reset the gateway singleton (useful for testing or config reload)
 */
export function resetGateway(): void {
    _gateway = null;
}

export default getPaymentGateway;
