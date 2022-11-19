// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/finance/VestingWalletUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";

contract MacondoMCDVestingWallet is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    VestingWalletUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    using SafeMathUpgradeable for uint256;
    using MathUpgradeable for uint256;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address beneficiaryAddress, uint64 startTimestamp)
        public
        initializer
    {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        //release cycle is 15 years.
        __VestingWallet_init(beneficiaryAddress, startTimestamp, 15 * 365 days);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    /**
     * @dev Virtual implementation of the vesting formula. This returns the amount vested, as a function of time, for
     * an asset given its total historical allocation.
     */
    function _vestingSchedule(uint256 totalAllocation, uint64 timestamp)
        internal
        view
        override
        whenNotPaused
        returns (uint256)
    {
        if (timestamp < start()) {
            return 0;
        } else if (timestamp > start() + duration()) {
            return totalAllocation;
        } else {
            return
                vestingTokens(totalAllocation, timestamp, start(), duration());
        }
    }

    /// @dev Returns the address of the current implementation.
    /// Release rules: a total of 15 years, half of the first day of release every 3 years, and release once every 10 minutes.
    /// 15 years are divided into 5 parts, and each three years are treated as a whole
    function vestingTokens(
        uint256 totalAllocation,
        uint64 timestamp,
        uint256 _start,
        uint256 _duration
    ) public pure returns (uint256) {
        //check the duration is 15 years
        require(_duration == 15 * 365 days, "duration is not 15 years");

        //Release total times: 15*365*24*60/10=788400
        //3 years release times:3*365*24*60/10=157680
        uint256 eachThreeYearReleaseTimes = 157680;

        //Calculate the number of shares to be released at the current time
        uint256 currentReleaseTimes = vestAmountTokenCurrentReleaseTimes(
            timestamp,
            _start
        );

        //Calculate the current release level 0,1,2,3,4
        uint256 currentReleaseLevel = currentReleaseTimes /
            eachThreeYearReleaseTimes;

        //Calculate the total amount released so far
        uint256 totalReleaseAmount = 0;
        for (uint256 i = 0; i <= currentReleaseLevel; i++) {
            //Calculate the number of tokens released each time at the current release level
            uint256 currentReleaseAmountPerTime = vestedAmountCurrentReleaseAmountPerTime(
                    totalAllocation,
                    i
                );

            //Calculate the number of times the current release level has been released
            uint256 currentLevelReleaseTimes = 0;
            if (i == currentReleaseLevel) {
                currentLevelReleaseTimes =
                    currentReleaseTimes %
                    eachThreeYearReleaseTimes;
            } else {
                currentLevelReleaseTimes = eachThreeYearReleaseTimes;
            }

            //Calculate the number of tokens released at the current release level
            uint256 currentReleaseAmount = currentReleaseAmountPerTime *
                currentLevelReleaseTimes;

            //Calculate the number of tokens released at the current release level
            totalReleaseAmount += currentReleaseAmount;
        }

        return totalReleaseAmount;
    }

    function vestAmountTokenCurrentReleaseTimes(
        uint64 timestamp,
        uint256 _start
    ) public pure returns (uint256) {
        return (timestamp - _start) / (10 * 60);
    }

    /// @notice Calculate the number of tokens per share
    ///the first 3 years, each year releases 16 parts
    ///the 4th-6th year, each year releases 8 parts
    ///the 7th-9th year, each year releases 4 parts
    ///the 10th-12th year, each year releases 2 parts
    ///the 13th-15th year, each year releases 1 parts
    ///total number of shares released in 15 years: 16+8+4+2+1=31
    function vestedAmountTokenPerShare(uint256 totalAllocation)
        public
        pure
        returns (uint256)
    {
        return totalAllocation.div(31).div(1 ether).mul(1 ether);
    }

    /// @notice Calculate the number of tokens per share
    function vestedAmountCurrentReleaseAmountPerTime(
        uint256 totalAllocation,
        uint256 currentReleaseLevel
    ) public pure returns (uint256) {
        uint256 tokenPerShare = vestedAmountTokenPerShare(totalAllocation);

        //Calculate the total number of tokens that can be released at the current release level
        uint256 currentReleaseLevelAmount = tokenPerShare *
            (2**(4 - currentReleaseLevel));
        //Release total times: 15*365*24*60/10=788400
        //3 years release times:3*365*24*60/10=157680
        uint256 eachThreeYearReleaseTimes = 157680;
        //Calculate the number of tokens released each time at the current release level
        uint256 currentReleaseAmountPerTime = currentReleaseLevelAmount
            .div(eachThreeYearReleaseTimes)
            .div(1 ether)
            .mul(1 ether);

        return currentReleaseAmountPerTime;
    }
}
