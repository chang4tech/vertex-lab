const startTime = Date.now();

export const healthController = {
  async status() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      startedAt: new Date(startTime).toISOString()
    };
  },

  async readiness() {
    return { status: 'ready' };
  },

  async liveness() {
    return { status: 'alive' };
  }
};
