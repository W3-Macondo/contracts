// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../core/interface/erc/ERC5679/IERC5679Ext20.sol";
import "../core/interface/IERCMINTExt20.sol";

/**
 * @title BNB\ERC20\ERC721 Token with control over token transfers
 */
contract TokenCollection is
    Initializable,
    AccessControlUpgradeable,
    ERC721HolderUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    event TokenReceived(address from, uint256 amount);
    event Withdraw(address to, uint256 amount);
    event ERC20Withdraw(
        IERC20Upgradeable indexed token,
        address indexed to,
        uint256 amount
    );
    event ERC721Withdraw(
        IERC721Upgradeable indexed token,
        address indexed to,
        uint256 tokenId
    );

    bytes32 public constant WITHDRAW = keccak256("WITHDRAW");
    bytes32 public constant WITHDRAW_ERC20 = keccak256("WITHDRAW_ERC20");
    bytes32 public constant WITHDRAW_ERC721 = keccak256("WITHDRAW_ERC721");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();
        __ERC721Holder_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    receive() external payable virtual {
        emit TokenReceived(_msgSender(), msg.value);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function withdraw(address payable to, uint256 amount)
        public
        whenNotPaused
        nonReentrant
        onlyRole(WITHDRAW)
    {
        AddressUpgradeable.sendValue(to, amount);
        emit Withdraw(to, amount);
    }

    function withdrawERC20(
        IERC20Upgradeable token,
        address to,
        uint256 value
    ) public onlyRole(WITHDRAW_ERC20) {
        _withdrawERC20(token, to, value);
    }

    function withdrawERC20WithMint(
        IERC20Upgradeable token,
        address to,
        uint256 value
    ) public onlyRole(WITHDRAW_ERC20) {
        //check token balance
        uint256 balance = token.balanceOf(address(this));
        if (balance < value) {
            uint256 diffToken = value - balance;
            IERCMINTExt20 minter = IERCMINTExt20(address(token));
            minter.mint(address(this), diffToken);
        }

        _withdrawERC20(token, to, value);
    }

    function _withdrawERC20(
        IERC20Upgradeable token,
        address to,
        uint256 value
    ) internal whenNotPaused nonReentrant {
        SafeERC20Upgradeable.safeTransfer(token, to, value);
        emit ERC20Withdraw(token, to, value);
    }

    function withdrawERC721(
        IERC721Upgradeable token,
        address to,
        uint256 tokenId
    ) public whenNotPaused nonReentrant onlyRole(WITHDRAW_ERC721) {
        token.safeTransferFrom(address(this), to, tokenId);
        emit ERC721Withdraw(token, to, tokenId);
    }
}
