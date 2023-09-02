-- A user has to has an Ethereum-format address, but does not need to have a username
-- nonce will be signed be the user's private key
CREATE TABLE users (
    eth_address VARCHAR(42) PRIMARY KEY,
    username VARCHAR(64) UNIQUE,
    role text CHECK (role IN ('User', 'ProjectOwner', 'Validator')),
    nonce BIGINT NOT NULL
);

-- This is how you insert a new user, without a username
INSERT INTO users (nonce, eth_address, role) VALUES (EXTRACT(EPOCH FROM NOW())::BIGINT + (1000000 + RANDOM()::BIGINT % 1000000), '0x123', 'User');

-- We can set the username later
UPDATE users SET username = 'alice' WHERE eth_address = '0x123';

-- Update nonce. It's important to update nonce, so an attacker can't copy the previous signature
UPDATE users SET nonce = (EXTRACT(EPOCH FROM NOW())::BIGINT + (1000000 + RANDOM()::BIGINT % 1000000)) WHERE eth_address = '0x123';



-- Tables that are related to CO2.Storage
-- (Transfer.Storage) :

-- This is the table that lists projects, this is not directly related to a CO2.Storage template
-- This connects all the other tables, that's the idea
CREATE TABLE projects (
    project_id VARCHAR(20) PRIMARY KEY,
    project_name TEXT NOT NULL,
    accepted_action_plan VARCHAR(23),
    hypercert VARCHAR(43),
    price_per_one INT,
    sell_limit INT,
    finished_id VARCHAR(22),
    signed_finished_id VARCHAR(21),
    project_owner VARCHAR(42) NOT NULL
);

-- ActionPlan list
-- project_id does not mean, that this is an active project, planned projects also have an id
CREATE TABLE action_plans (
    action_plan_id VARCHAR(23) PRIMARY KEY,
    project_id VARCHAR(20) NOT NULL,
    project_owner VARCHAR(42) NOT NULL,
    nonce INT NOT NULL
);

-- ActionPlans that made into an active project
CREATE TABLE accepted_action_plans (
    action_plan_id VARCHAR(23) PRIMARY KEY,
    action_plan_cid TEXT UNIQUE NOT NULL,
    project_id VARCHAR(20) UNIQUE NOT NULL,
    project_owner VARCHAR(42) NOT NULL
);

-- Finished projects
-- SignedFinishedProject object might not exist yet
CREATE TABLE finished_projects (
    finished_project_id VARCHAR(22) PRIMARY KEY,
    signed_finished_project_id VARCHAR(21),
    project_id VARCHAR(20) UNIQUE NOT NULL,
    project_owner VARCHAR(42) NOT NULL
);




--IDs
--We will use Type-[12-char-sha256-portion]
-- Project-0123456789ab        -   ProjectId
-- ActionPlan-0123456789ab     -   ActionPlanId
-- AcceptedAP-0123456789ab     -   AcceptedActionPlanId (Same as ActionPlanId, but with different prefix)
-- Comment-0123456789ab        -   CommentId
-- Progress-0123456789ab       -   ProgressReportId
-- Finished-01234567890ab      -   FinishedProjectId
-- SignedFP-0123456789ab       -   SignedFinishedProjectId
-- FollowUp-0123456789ab       -   FollowUpReportId
-- SignedFu-0123456789ab       -   SignedFollowUpId