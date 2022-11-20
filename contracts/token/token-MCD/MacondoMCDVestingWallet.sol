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

    struct ReleaseLevel {
        // The amount of tokens to be released at this level
        uint256 level;
        // The total times of tokens released at this level
        uint256 releaseTotalTimes;
        //release ratio coefficient 16, 8, 4, 2, 1
        uint256 releaseRatio;
    }

    mapping(uint256 => ReleaseLevel) public releaseLevels;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address beneficiaryAddress) public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        //release cycle is 15 years.
        //startTimestamp is 2023-01-01 00:00:00, durationSeconds is 15 years.
        //total 15 years,include 4 leap years, total 5479 days.
        __VestingWallet_init(beneficiaryAddress, 1672502400, 5479 days);

        _initializeReleaseLevels();

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

    function _initializeReleaseLevels() internal {
        //years: 2023,2024,2025
        //release times: 52560,52704(1),52560
        _addReleaseLevel(0, 52560 + 52704 + 52560, 16);

        //years: 2026,2027,2028
        //release times: 52560,52560,52704(1)
        _addReleaseLevel(1, 52560 + 52560 + 52704, 8);

        //years: 2029,2030,2031
        //release times: 52560,52560,52560
        _addReleaseLevel(2, 52560 + 52560 + 52560, 4);

        //years: 2032,2033,2034
        //release times: 52704(1),52560,52560
        _addReleaseLevel(3, 52704 + 52560 + 52560, 2);

        //years: 2035,2036,2037
        //release times: 52560,52704(1),52560
        _addReleaseLevel(4, 52560 + 52704 + 52560, 1);
    }

    function _addReleaseLevel(
        uint256 level,
        uint256 releaseTotalTimes,
        uint256 releaseRatio
    ) internal {
        require(level >= 0, "level must be greater than 0");
        require(
            releaseTotalTimes > 0,
            "MacondoMCDVestingWallet: releaseTotalTimes must be greater than 0"
        );
        require(
            releaseRatio > 0,
            "MacondoMCDVestingWallet: releaseRatio must be greater than 0"
        );
        releaseLevels[level] = ReleaseLevel(
            level,
            releaseTotalTimes,
            releaseRatio
        );
    }

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
            return vestingTokens(totalAllocation, timestamp, start());
        }
    }

    /// @dev Returns the address of the current implementation.
    /// Release rules: a total of 15 years, half of the first day of release every 3 years, and release once every 10 minutes.
    /// 15 years are divided into 5 parts, and each three years are treated as a whole
    function vestingTokens(
        uint256 totalAllocation,
        uint64 timestamp,
        uint256 _start
    ) public view returns (uint256) {
        require(timestamp >= _start, "timestamp must be greater than start");
        //Calculate the number of shares to be released at the current time
        uint256 currentReleaseTimes = vestAmountTokenCurrentReleaseTimes(
            timestamp,
            _start
        );
        if (currentReleaseTimes == 0) {
            return 0;
        }

        //Calculate the current release level 0,1,2,3,4
        uint256 currentReleaseLevel = calculateReleaseLevel(
            currentReleaseTimes
        );

        //Calculate the total amount released so far
        uint256 totalReleaseAmount = 0;

        for (uint256 i = 0; i <= currentReleaseLevel; i++) {
            //Calculate the number of tokens released each time at the current release level
            uint256 currentReleaseAmountPerTime = vestedAmountCurrentReleaseAmountPerTime(
                    totalAllocation,
                    i
                );

            uint256 eachThreeYearReleaseTimes = releaseLevels[i]
                .releaseTotalTimes;
            //Calculate the number of times the current release level has been released
            uint256 currentLevelReleaseTimes = 0;
            if (i == currentReleaseLevel) {
                currentLevelReleaseTimes = calculateCurrentLevelReleaseTimes(
                    currentReleaseTimes
                );
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
        return (timestamp - _start) / (10 * 60) + 1;
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
    ) public view returns (uint256) {
        //Calculate the total number of tokens that can be released at the current release level
        uint256 currentReleaseLevelAmount = releaseLevelAmount(
            totalAllocation,
            currentReleaseLevel
        );
        uint256 eachThreeYearReleaseTimes = releaseLevels[currentReleaseLevel]
            .releaseTotalTimes;
        //Calculate the number of tokens released each time at the current release level
        uint256 currentReleaseAmountPerTime = currentReleaseLevelAmount
            .div(eachThreeYearReleaseTimes)
            .div(1 ether)
            .mul(1 ether);

        return currentReleaseAmountPerTime;
    }

    function calculateReleaseLevel(uint256 currentReleaseTimes)
        public
        view
        returns (uint256)
    {
        require(
            currentReleaseTimes > 0,
            "currentReleaseTimes must be greater than 0"
        );
        uint256 totalReleaseTimes = 0;
        for (uint256 i = 0; i < 5; i++) {
            totalReleaseTimes += releaseLevels[i].releaseTotalTimes;
            if (currentReleaseTimes <= totalReleaseTimes) {
                return i;
            }
        }
        require(false, "currentReleaseTimes is error");
        return 5;
    }

    function calculateCurrentLevelReleaseTimes(uint256 currentReleaseTimes)
        public
        view
        returns (uint256)
    {
        require(
            currentReleaseTimes > 0,
            "currentReleaseTimes must be greater than 0"
        );
        uint256 totalReleaseTimes = 0;
        for (uint256 i = 0; i < 5; i++) {
            uint256 currentLevelReleaseTotalTimes = releaseLevels[i]
                .releaseTotalTimes;
            if (
                currentReleaseTimes <=
                totalReleaseTimes + currentLevelReleaseTotalTimes
            ) {
                return currentReleaseTimes - totalReleaseTimes;
            }
            totalReleaseTimes += currentLevelReleaseTotalTimes;
        }
        require(false, "currentReleaseTimes is error");
        return 0;
    }

    function releaseLevelAmount(
        uint256 totalAllocation,
        uint256 currentReleaseLevel
    ) public pure returns (uint256) {
        uint256 tokenPerShare = vestedAmountTokenPerShare(totalAllocation);

        //Calculate the total number of tokens that can be released at the current release level
        uint256 currentReleaseLevelAmount = tokenPerShare *
            (2**(4 - currentReleaseLevel));
        return currentReleaseLevelAmount;
    }
}
