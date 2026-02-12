// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.20;

import "./fireblocks/ERC20F.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title UniqueAssetToken
 * @notice Unique sample RWA token (UAT) with UUPS upgradeability and live oracles.
 */
contract UniqueAssetToken is ERC20F {

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the token
     * @param defaultAdmin Admin address
     * @param minter Minter address
     * @param pauser Pauser address
     */
    function initialize(
        address defaultAdmin,
        address minter,
        address pauser
    ) public initializer {
        // Initialize base ERC20F with name "UniqueAsset" and symbol "UAT"
        super.initialize("UniqueAsset", "UAT", defaultAdmin, minter, pauser);
        
        // Mint initial supply of 10 tokens (with 18 decimals) to the deployer
        _mint(msg.sender, 10 * 10**decimals());
    }

    AggregatorV3Interface public navOracle;
    AggregatorV3Interface public porOracle;

    /**
     * @notice Setup Chainlink oracles
     */
    function setupOracles(
        address navOracleAddress,
        address porOracleAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        navOracle = AggregatorV3Interface(navOracleAddress);
        porOracle = AggregatorV3Interface(porOracleAddress);
    }

    function getNAV() external view returns (int) {
        require(address(navOracle) != address(0), "NAV Oracle not set");
        (, int price,,,) = navOracle.latestRoundData();
        return price;
    }

    function getProofOfReserve() external view returns (int) {
        require(address(porOracle) != address(0), "PoR Oracle not set");
        (, int reserve,,,) = porOracle.latestRoundData();
        return reserve;
    }
}
