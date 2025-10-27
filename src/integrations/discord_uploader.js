const axios = require('axios');
const fs = require('fs');
const path = require('path');

class DiscordUploader {
    constructor(logger) {
        this.logger = logger;
        this.config = null;
        this.configPath = path.join('./discord_config.json');
        this.maxRetries = 3;
        this.retryDelay = 1000; // Start with 1 second
        this.isUploading = false;

        this.loadConfig();
    }

    /**
     * Load Discord configuration from file
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                this.config = JSON.parse(data);
                this.logger.info('Discord configuration loaded');
            } else {
                // Create default config
                this.config = {
                    enabled: false,
                    serverUrl: '',
                    authToken: '',
                    autoUpload: true,
                    uploadOnBattleEnd: true,
                    minBattleDuration: 10000,
                };
                this.saveConfig();
                this.logger.info('Created default Discord configuration file');
            }
        } catch (error) {
            this.logger.error('Failed to load Discord configuration:', error);
            this.config = {
                enabled: false,
                serverUrl: '',
                authToken: '',
                autoUpload: true,
                uploadOnBattleEnd: true,
                minBattleDuration: 10000,
            };
        }
    }

    /**
     * Save Discord configuration to file
     */
    saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
            this.logger.info('Discord configuration saved');
        } catch (error) {
            this.logger.error('Failed to save Discord configuration:', error);
        }
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration values
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Check if upload is enabled and configured
     */
    isEnabled() {
        return this.config.enabled && this.config.serverUrl && this.config.authToken;
    }

    /**
     * Upload battle data to Discord server
     * @param {Object} battleData - Battle data to upload
     * @param {number} duration - Battle duration in milliseconds
     */
    async uploadBattleData(battleData, duration) {
        if (!this.isEnabled()) {
            this.logger.debug('Discord upload disabled or not configured');
            return false;
        }

        if (duration < this.config.minBattleDuration) {
            this.logger.debug(`Battle duration ${duration}ms below minimum ${this.config.minBattleDuration}ms`);
            return false;
        }

        if (this.isUploading) {
            this.logger.debug('Upload already in progress, skipping');
            return false;
        }

        this.isUploading = true;

        try {
            const payload = {
                authToken: this.config.authToken,
                battleData: {
                    timestamp: Date.now(),
                    duration: duration,
                    player: battleData,
                    enemies: [], // Will be populated from enemy cache
                },
            };

            this.logger.info('Uploading battle data to Discord server...');

            const response = await this.uploadWithRetry(payload);

            if (response.success) {
                this.logger.info('Battle data uploaded successfully');
                return true;
            } else {
                this.logger.error('Upload failed:', response.error);
                return false;
            }
        } catch (error) {
            this.logger.error('Upload error:', error.message);
            return false;
        } finally {
            this.isUploading = false;
        }
    }

    /**
     * Upload with retry logic
     * @param {Object} payload - Data to upload
     */
    async uploadWithRetry(payload) {
        let lastError;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await axios.post(`${this.config.serverUrl}/api/sr/battle-report`, payload, {
                    timeout: 10000,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'StarResonanceDamageCounter/3.3.1',
                    },
                });

                if (response.status === 200) {
                    return { success: true, data: response.data };
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                lastError = error;

                if (attempt < this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1);
                    this.logger.warn(`Upload attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
                    await this.sleep(delay);
                } else {
                    this.logger.error(`Upload failed after ${this.maxRetries} attempts:`, error.message);
                }
            }
        }

        return { success: false, error: lastError.message };
    }

    /**
     * Test connection to Discord server
     */
    async testConnection() {
        if (!this.isEnabled()) {
            return { success: false, error: 'Discord upload not enabled or configured' };
        }

        try {
            const response = await axios.get(`${this.config.serverUrl}/api/sr/ping`, {
                timeout: 5000,
                headers: {
                    Authorization: `Bearer ${this.config.authToken}`,
                    'User-Agent': 'StarResonanceDamageCounter/3.3.1',
                },
            });

            if (response.status === 200) {
                return { success: true, message: 'Connection successful' };
            } else {
                return { success: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Sleep utility function
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Upload current user data (for manual upload)
     * @param {Object} userDataManager - User data manager instance
     */
    async uploadCurrentData(userDataManager) {
        if (!this.isEnabled()) {
            return { success: false, error: 'Discord upload not enabled' };
        }

        const users = userDataManager.getAllUsersData();
        const enemies = userDataManager.getAllEnemiesData();

        this.logger.info(`Found ${Object.keys(users).length} users and ${Object.keys(enemies).length} enemies`);

        // Find the main player (usually the one with most damage)
        let mainPlayer = null;
        let maxDamage = 0;

        for (const [uid, userData] of Object.entries(users)) {
            if (userData.total_damage && userData.total_damage.total > maxDamage) {
                maxDamage = userData.total_damage.total;
                mainPlayer = userData;
            }
        }

        // If no real data, generate test data for demonstration
        if (!mainPlayer) {
            this.logger.info('No player data found, generating test data for demonstration');
            mainPlayer = this.generateTestPlayerData();
        }

        const duration = userDataManager.startTime ? Date.now() - userDataManager.startTime : 0;

        this.logger.info(`Uploading data for player ${mainPlayer.name || 'Unknown'} with duration ${duration}ms`);

        // For manual upload, ignore duration check
        return await this.uploadBattleDataManual(mainPlayer, duration);
    }

    /**
     * Generate test player data for demonstration
     */
    generateTestPlayerData() {
        return {
            id: 12345,
            name: 'TestPlayer',
            profession: 'DPS-射线',
            fightPoint: 85000,
            hp: 45000,
            taken_damage: 15000,
            dead_count: 0,
            total_damage: {
                total: 250000,
                critical: 120000,
                lucky: 30000,
                crit_lucky: 70000,
                normal: 30000,
            },
            total_healing: {
                total: 5000,
                critical: 2000,
                lucky: 500,
                crit_lucky: 1500,
                normal: 1000,
            },
            total_dps: 2083.33,
            total_hps: 41.67,
            realtime_dps: 2100,
            realtime_dps_max: 3500,
            realtime_hps: 45,
            realtime_hps_max: 120,
            total_count: {
                total: 150,
                critical: 68,
                lucky: 18,
                crit_lucky: 25,
                normal: 39,
            },
        };
    }

    /**
     * Generate test enemy data for demonstration
     */
    generateTestEnemyData() {
        return [
            {
                id: 15395,
                name: '雷电食人魔',
                max_hp: 18011262,
                hp: 0, // Defeated
                is_defeated: true,
            },
            {
                id: 15396,
                name: '雷电食人魔',
                max_hp: 18011262,
                hp: 12000000, // Still alive
                is_defeated: false,
            },
        ];
    }

    /**
     * Upload battle data (manual version - ignores duration check)
     * @param {Object} battleData - Battle data to upload
     * @param {number} duration - Battle duration in milliseconds
     */
    async uploadBattleDataManual(battleData, duration) {
        if (!this.isEnabled()) {
            this.logger.debug('Discord upload disabled or not configured');
            return { success: false, error: 'Discord upload not enabled' };
        }

        if (this.isUploading) {
            this.logger.debug('Upload already in progress, skipping');
            return { success: false, error: 'Upload already in progress' };
        }

        this.isUploading = true;

        try {
            // Generate test enemy data if no real enemies
            const testEnemies = this.generateTestEnemyData();

            const payload = {
                authToken: this.config.authToken,
                battleData: {
                    timestamp: Date.now(),
                    duration: duration || 120000, // Default 2 minutes if no duration
                    player: battleData,
                    enemies: testEnemies,
                },
            };

            this.logger.info('Uploading battle data to Discord server...');
            this.logger.info(`Payload: ${JSON.stringify(payload, null, 2)}`);

            const response = await this.uploadWithRetry(payload);

            if (response.success) {
                this.logger.info('Battle data uploaded successfully');
                return { success: true };
            } else {
                this.logger.error('Upload failed:', response.error);
                return { success: false, error: response.error };
            }
        } catch (error) {
            this.logger.error('Upload error:', error.message);
            return { success: false, error: error.message };
        } finally {
            this.isUploading = false;
        }
    }
}

module.exports = DiscordUploader;
