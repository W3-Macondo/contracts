// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/finance/PaymentSplitterUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../../core/contract-upgradeable/VersionUpgradeable.sol";

contract AccountPaymentSplitter is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    PaymentSplitterUpgradeable,
    UUPSUpgradeable,
    VersionUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address[] memory payees,
        uint256[] memory shares_
    ) public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __VersionUpgradeable_init();
        __PaymentSplitter_init(payees, shares_);

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

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev Returns the version of the contract.
     */
    function _version() internal pure virtual override returns (uint256) {
        return 1;
    }

    //override release function
    function releaseETH(address payable payee) public whenNotPaused {
        release(payee);
    }

    //override release function
    function releaseERC20(
        IERC20Upgradeable token,
        address account
    ) public whenNotPaused {
        release(token, account);
    }
}
