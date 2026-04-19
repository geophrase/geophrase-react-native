import * as React from 'react';

export interface GeophraseAddress {
    phrase: string;
    [key: string]: any;
}

export interface GeophraseToken {
    token: string;
}

export interface GeophraseError {
    type: 'API_ERROR' | 'NETWORK_ERROR';
    status?: number;
    message: string;
}

export interface GeophraseConnectProps {
    visible: boolean;
    mode?: 'client' | 'server';
    theme?: 'light' | 'dark' | 'system';
    apiKey?: string;
    orderId?: string;
    phone?: string;
    onSuccess: (result: GeophraseAddress | GeophraseToken) => void;
    onError?: (error: GeophraseError) => void;
    onClose?: () => void;
}

declare const GeophraseConnect: React.FC<GeophraseConnectProps>;

export { GeophraseConnect };
export default GeophraseConnect;