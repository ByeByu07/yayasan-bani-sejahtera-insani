declare module 'midtrans-client' {
    export class Snap {
        constructor({ isProduction: boolean, serverKey: string, clientKey: string }) {
        }
        createTransaction(params: any): Promise<any>;
    }
}