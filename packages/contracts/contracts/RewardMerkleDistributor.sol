// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title RewardMerkleDistributor
/// @notice Disabled-by-default monthly reward claim distributor for reviewed MachinesRoom batches.
/// @dev Deployment, funding, and batch creation must remain behind backend feature flags and admin review.
contract RewardMerkleDistributor {
    error NotAdmin();
    error InvalidAdmin();
    error InvalidToken();
    error InvalidBatch();
    error BatchExists();
    error BatchNotFound();
    error BatchFrozen();
    error BatchInactive();
    error BatchExpired();
    error Paused();
    error AlreadyClaimed();
    error InvalidProof();
    error TransferFailed();

    struct Batch {
        bytes32 merkleRoot;
        uint256 totalAmount;
        uint256 claimedAmount;
        uint64 activateAt;
        uint64 expiresAt;
        bool frozen;
        bool exists;
        string metadataURI;
    }

    bytes32 public constant CLAIM_LEAF_DOMAIN = sha256("TMR_REWARD_CLAIM_V1");

    IERC20Minimal public immutable token;
    address public admin;
    bool public paused;

    mapping(bytes32 batchId => Batch batch) public batches;
    mapping(bytes32 batchId => mapping(bytes32 leafHash => bool claimed)) public claimedLeaves;

    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event PausedSet(bool paused);
    event BatchCreated(
        bytes32 indexed batchId,
        bytes32 indexed merkleRoot,
        uint256 totalAmount,
        uint64 activateAt,
        uint64 expiresAt,
        string metadataURI
    );
    event BatchFrozenSet(bytes32 indexed batchId, bool frozen);
    event Claimed(bytes32 indexed batchId, bytes32 indexed leafHash, address indexed account, uint256 amount);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(address token_, address admin_) {
        if (token_ == address(0)) revert InvalidToken();
        if (admin_ == address(0)) revert InvalidAdmin();
        token = IERC20Minimal(token_);
        admin = admin_;
        emit AdminTransferred(address(0), admin_);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert InvalidAdmin();
        address previous = admin;
        admin = newAdmin;
        emit AdminTransferred(previous, newAdmin);
    }

    function setPaused(bool paused_) external onlyAdmin {
        paused = paused_;
        emit PausedSet(paused_);
    }

    function createBatch(
        bytes32 batchId,
        bytes32 merkleRoot,
        uint256 totalAmount,
        uint64 activateAt,
        uint64 expiresAt,
        string calldata metadataURI
    ) external onlyAdmin {
        if (batchId == bytes32(0) || merkleRoot == bytes32(0) || totalAmount == 0) revert InvalidBatch();
        if (expiresAt != 0 && expiresAt <= activateAt) revert InvalidBatch();
        if (batches[batchId].exists) revert BatchExists();

        batches[batchId] = Batch({
            merkleRoot: merkleRoot,
            totalAmount: totalAmount,
            claimedAmount: 0,
            activateAt: activateAt,
            expiresAt: expiresAt,
            frozen: false,
            exists: true,
            metadataURI: metadataURI
        });

        emit BatchCreated(batchId, merkleRoot, totalAmount, activateAt, expiresAt, metadataURI);
    }

    function setBatchFrozen(bytes32 batchId, bool frozen) external onlyAdmin {
        Batch storage batch = batches[batchId];
        if (!batch.exists) revert BatchNotFound();
        batch.frozen = frozen;
        emit BatchFrozenSet(batchId, frozen);
    }

    function computeLeafHash(
        bytes32 batchId,
        uint256 index,
        address account,
        uint256 amount,
        bytes32 payoutIdsHash
    ) public pure returns (bytes32) {
        return sha256(abi.encodePacked(CLAIM_LEAF_DOMAIN, batchId, index, account, amount, payoutIdsHash));
    }

    function verifyProof(
        bytes32 leafHash,
        bytes32[] calldata proof,
        bool[] calldata proofLeft,
        bytes32 merkleRoot
    ) public pure returns (bool) {
        if (proof.length != proofLeft.length) return false;

        bytes32 computed = leafHash;
        for (uint256 i = 0; i < proof.length; i++) {
            computed = proofLeft[i]
                ? sha256(abi.encodePacked(proof[i], computed))
                : sha256(abi.encodePacked(computed, proof[i]));
        }
        return computed == merkleRoot;
    }

    function claim(
        bytes32 batchId,
        uint256 index,
        uint256 amount,
        bytes32 payoutIdsHash,
        bytes32[] calldata proof,
        bool[] calldata proofLeft
    ) external {
        if (paused) revert Paused();

        Batch storage batch = batches[batchId];
        if (!batch.exists) revert BatchNotFound();
        if (batch.frozen) revert BatchFrozen();
        if (block.timestamp < batch.activateAt) revert BatchInactive();
        if (batch.expiresAt != 0 && block.timestamp > batch.expiresAt) revert BatchExpired();

        bytes32 leafHash = computeLeafHash(batchId, index, msg.sender, amount, payoutIdsHash);
        if (claimedLeaves[batchId][leafHash]) revert AlreadyClaimed();
        if (!verifyProof(leafHash, proof, proofLeft, batch.merkleRoot)) revert InvalidProof();

        batch.claimedAmount += amount;
        if (batch.claimedAmount > batch.totalAmount) revert InvalidBatch();
        claimedLeaves[batchId][leafHash] = true;

        if (!token.transfer(msg.sender, amount)) revert TransferFailed();
        emit Claimed(batchId, leafHash, msg.sender, amount);
    }
}
