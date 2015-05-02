module.exports = {
  consumer_key: process.env["seven_digital_consumer_key"],
  consumer_secret: process.env["seven_digital_consumer_secret"],
  moody_service_baseurl: process.env["moody_service_baseurl"],
  subscription_mode: process.env["subscription_mode"] === "true"
};