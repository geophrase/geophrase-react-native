import * as React from 'react';

/**
 * Fully-resolved address returned in client mode.
 * Field names mirror the Geophrase REST API response shape.
 */
export interface GeophraseAddress {
    phrase: string;
    verified_account_mobile_num: string;
    address_type: string;
    contact_full_name: string;
    contact_mobile_num: string;
    address_line_one: string;
    address_line_two: string;
    landmark: string;
    city: string;
    state: string;
    postal_code: number;
    latitude: number;
    longitude: number;
    digi_pin: string;
    qr_code: string;
}

/**
 * Short-lived opaque token returned in server mode.
 * Forward to your backend to exchange for a GeophraseAddress.
 */
export interface GeophraseToken {
    token: string;
}

export interface GeophraseError {
    type: 'API_ERROR' | 'NETWORK_ERROR';
    status?: number;
    message: string;
}

export interface GeophraseConnectProps {
    /** Controls whether the widget modal is open. */
    visible: boolean;

    /** 'client' (default) or 'server'. Controls whether the SDK resolves the token itself or hands it to you. */
    mode?: 'client' | 'server';

    /** Widget theme. Defaults to 'system'. */
    theme?: 'light' | 'dark' | 'system';

    /** API key. Required when mode is 'client'; omit in server mode. */
    apiKey?: string;

    /** Your internal reference ID; echoed back in the dashboard. */
    orderId?: string;

    /** Prefill the phone field so the user skips one step of OTP entry. */
    phone?: string;

    /**
     * Called when the user successfully selects an address.
     * - client mode: receives a GeophraseAddress
     * - server mode: receives a GeophraseToken
     */
    onSuccess?: (result: GeophraseAddress | GeophraseToken) => void;

    /** Called on API, network, or validation errors. */
    onError?: (error: GeophraseError) => void;

    /** Called when the user dismisses the widget. */
    onClose?: () => void;
}

declare const GeophraseConnect: React.FC<GeophraseConnectProps>;

export { GeophraseConnect };
export default GeophraseConnect;