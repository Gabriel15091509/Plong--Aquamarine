const crypto = require("node:crypto");
const { Op } = require("sequelize");
const AuthSession = require("../models/AuthSession");
const { User } = require("../models");
const { isServiceIdentity } = require("../../../shared/serviceAuth");
const IDLE_MS = 15 * 60 * 1000;
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const credentialHash = (user) => hash(`${user.password}:${user.role}:${Boolean(user.must_change_password)}`);

async function register(token, user) {
  const { exp } = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  await AuthSession.create({ token_hash: hash(token), user_id: user.id, credential_hash: credentialHash(user), expires_at: new Date(exp * 1000), last_seen_at: new Date() });
  return token;
}
async function validate(decoded, token) {
  if (isServiceIdentity(decoded)) return true;
  if (!decoded.jti) return false;
  const user = await User.findByPk(decoded.id);
  if (!user?.active) return false;
  // The conditional UPDATE cannot resurrect a deleted or idle-expired session.
  const [count] = await AuthSession.update({ last_seen_at: new Date() }, { where: {
    token_hash: hash(token), user_id: user.id, credential_hash: credentialHash(user),
    expires_at: { [Op.gt]: new Date() }, last_seen_at: { [Op.gt]: new Date(Date.now() - IDLE_MS) },
  } });
  return count === 1;
}
async function revoke(token) { if (token) await AuthSession.destroy({ where: { token_hash: hash(token) } }); }
async function revokeUser(userId) { await AuthSession.destroy({ where: { user_id: userId } }); }
module.exports = { register, validate, revoke, revokeUser, IDLE_MS };
