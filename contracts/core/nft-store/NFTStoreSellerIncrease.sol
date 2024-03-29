// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./NFTStore.sol";

contract NFTStoreSellerIncrease is Initializable, NFTStore {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIdCounter;

    //initial token id
    uint256 internal _initialTokenId;

    /**
     * @dev Initializes the contract
     */
    function __NFTStoreSellerIncrease_init() internal onlyInitializing {
        __NFTStoreSellerIncrease_init_unchained();
    }

    function __NFTStoreSellerIncrease_init_unchained()
        internal
        onlyInitializing
    {}

    /**
     * initial token id to start
     * also initial token id counter
     */
    function _setInitialTokenId(uint256 initialTokenId) internal {
        // check initial token id is not in sold list
        if (soldList[initialTokenId] != address(0)) {
            revert("initial token id is in sold list");
        }

        _initialTokenId = initialTokenId;
        _tokenIdCounter.reset();
    }

    function currentTokenId() public view returns (uint256) {
        return _tokenIdCounter.current() + _initialTokenId;
    }

    function _saleWithIncreaseTokenId(address to) internal virtual {
        uint256 _tokenId = currentTokenId();
        _tokenIdCounter.increment();

        string memory _uri = _StoreItemTokenURI(_tokenId);
        _sale(to, _tokenId, _uri, defaultConfig.price);
    }

    function _saleFreeWithIncreaseTokenId(address to) internal virtual {
        uint256 _tokenId = currentTokenId();
        _tokenIdCounter.increment();

        string memory _uri = _StoreItemTokenURI(_tokenId);
        _saleFree(to, _tokenId, _uri);
    }

    function _StoreItemTokenURI(uint256 tokenId)
        internal
        virtual
        returns (string memory)
    {
        return StringsUpgradeable.toString(tokenId);
    }
}
