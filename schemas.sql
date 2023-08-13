-- A user has to has an Ethereum-format address, but does not need to have a username
-- nonce will be signed be the user's private key
CREATE TABLE users (
    eth_address VARCHAR(42) PRIMARY KEY,
    username VARCHAR(64) UNIQUE,
    nonce BIGINT NOT NULL
);

-- This is how you insert a new user, without a username
INSERT INTO users (nonce, eth_address) VALUES (EXTRACT(EPOCH FROM NOW())::BIGINT + (1000000 + RANDOM()::BIGINT % 1000000), '0x123');

-- We can set the username later
UPDATE users SET username = 'alice' WHERE eth_address = '0x123';

-- Update nonce. It's important to update nonce, so an attacker can't copy the previous signature
UPDATE users SET nonce = (EXTRACT(EPOCH FROM NOW())::BIGINT + (1000000 + RANDOM()::BIGINT % 1000000)) WHERE eth_address = '0x123';
