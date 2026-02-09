import axios from 'axios';

export interface EvolutionInstance {
    instanceName: string;
    description?: string;
    status: 'open' | 'close' | 'connecting' | 'qrcode';
}

export class EvolutionService {
    private baseUrl: string;
    private apiKey: string;

    constructor(baseUrl: string, apiKey: string) {
        // Remove trailing slash if present
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
    }

    private get headers() {
        return {
            'Content-Type': 'application/json',
            'apikey': this.apiKey
        };
    }

    async createInstance(instanceName: string) {
        try {
            const response = await axios.post(`${this.baseUrl}/instance/create`, {
                instanceName: instanceName,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS"
            }, { headers: this.headers });
            return response.data;
        } catch (error) {
            console.error('Error creating instance:', error);
            throw error;
        }
    }

    async connectInstance(instanceName: string) {
        try {
            const response = await axios.get(`${this.baseUrl}/instance/connect/${instanceName}`, {
                headers: this.headers
            });
            return response.data; // Should contain base64 or qrcode
        } catch (error) {
            console.error('Error connecting instance:', error);
            throw error;
        }
    }

    async fetchInstances() {
        try {
            const response = await axios.get(`${this.baseUrl}/instance/fetchInstances`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching instances:', error);
            return [];
        }
    }

    async getConnectionState(instanceName: string) {
        try {
            const response = await axios.get(`${this.baseUrl}/instance/connectionState/${instanceName}`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching connection state:', error);
            throw error;
        }
    }

    async deleteInstance(instanceName: string) {
        try {
            const response = await axios.delete(`${this.baseUrl}/instance/delete/${instanceName}`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting instance:', error);
            throw error;
        }
    }
    async sendText(instanceName: string, number: string, text: string) {
        try {
            const response = await axios.post(`${this.baseUrl}/message/sendText/${instanceName}`, {
                number: number,
                text: text,
                delay: 1200,
                linkPreview: true
            }, { headers: this.headers });
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }
}
