import * as React from 'react';

/**
 * Nested address block within a fully-resolved client-mode response.
 * Field names mirror the Geophrase REST API response shape.
 */
export interface GeophraseAddressDetails {
    city: string;
    state: string;
    digi_pin: string;
    landmark: string;
    latitude: number;
    longitude: number;
    postal_code: number;
    address_type: string;
    address_line_one: string;
    address_line_two: string;
    contact_full_name: string;
    verified_mobile_num: string;
}

/**
 * Fully-resolved address returned in client mode.
 * All fields are always present; `order_id`, `landmark`, and `address_line_two`
 * may be empty strings — never `null`.
 */
export interface GeophraseAddress {
    short_code: string;
    short_link: string;
    qr_code: string;
    captured_at: number;
    order_id: string;
    address: GeophraseAddressDetails;
}

/**
 * Short-lived UUID4 returned in server mode.
 * Forward to your backend to exchange for a GeophraseAddress.
 */
export interface GeophraseRequestId {
    requestId: string;
}

export interface GeophraseError {
    type: 'API_ERROR' | 'NETWORK_ERROR';
    status?: number;
    message: string;
}

export interface GeophraseConnectProps {
    /** Controls whether the widget modal is open. */
    visible: boolean;

    /** Your 8-character public Key ID (shown in the dashboard). Required in both modes; identifies your account to the widget. */
    apiKeyId: string;

    /** 'client' (default) or 'server'. Controls whether the SDK resolves the requestId itself or hands it to you. */
    mode?: 'client' | 'server';

    /** Widget theme. Defaults to 'system'. */
    theme?: 'light' | 'dark' | 'system';

    /** Secret API key. Required when mode is 'client'; omit in server mode. */
    apiKey?: string;

    /** Your internal reference ID; echoed back in the dashboard and in the client-mode response. */
    orderId?: string;

    /** Prefill the phone field so the user skips one step of OTP entry. */
    phone?: string;

    /**
     * Called when the user successfully selects an address.
     * - client mode: receives a GeophraseAddress
     * - server mode: receives a GeophraseRequestId
     */
    onSuccess?: (result: GeophraseAddress | GeophraseRequestId) => void;

    /** Called on API, network, or validation errors. */
    onError?: (error: GeophraseError) => void;

    /** Called when the user dismisses the widget. */
    onClose?: () => void;
}

declare const GeophraseConnect: React.FC<GeophraseConnectProps>;

export { GeophraseConnect };
export default GeophraseConnect;
