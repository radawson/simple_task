// pm2 environmental config

module.exports = {
    apps: [{
        name: "server",
        script: "./server.js",
        watch: true,
        ignore_watch: [
            "images",
            "logs"],
        env: {
            "NODE_ENV": "production"
        }
    }]
}
