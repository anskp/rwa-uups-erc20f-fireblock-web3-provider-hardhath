// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RWAOracle
 * @notice A simple mock aggregator for RWA tokens to handle NAV and PoR.
 */
contract RWAOracle is AggregatorV3Interface, Ownable {
    
    int256 private s_answer;
    uint80 private s_roundId;
    uint256 private s_updatedAt;
    uint8 private s_decimals;
    string private s_description;

    constructor(string memory description, uint8 decimalsValue, int256 initialValue) {
        s_description = description;
        s_decimals = decimalsValue;
        updateValue(initialValue);
    }

    function updateValue(int256 newValue) public onlyOwner {
        s_answer = newValue;
        s_roundId++;
        s_updatedAt = block.timestamp;
    }

    function decimals() external view override returns (uint8) {
        return s_decimals;
    }

    function description() external view override returns (string memory) {
        return s_description;
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (_roundId, s_answer, s_updatedAt, s_updatedAt, _roundId);
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (s_roundId, s_answer, s_updatedAt, s_updatedAt, s_roundId);
    }
}
