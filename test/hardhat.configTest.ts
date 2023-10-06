import { HardhatUserConfig } from "hardhat/config";
import { assert, expect } from "chai";
import "hardhat-deploy";

import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../.env" });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

describe("Hardhat config test", function () {

    it("should have correct properties", function () {
        const config: HardhatUserConfig = require('../hardhat.config.ts');

        assert.exists(config.w3f);
        expect(config.w3f.rootDir).to.equal('./web3-functions');
        expect(config.w3f.debug).to.equal(false);
        expect(config.w3f.networks).to.eql(['avalanche', 'arbitrum']);

        assert.exists(config.solidity);
        expect(config.solidity.compilers[0].version).to.equal('0.8.21');
        
        assert.exists(config.typechain);
        expect(config.typechain.outDir).to.equal('typechain');
        expect(config.typechain.target).to.equal('ethers-v6');
        
        assert.exists(config.namedAccounts);
        expect(config.namedAccounts.deployer.default).to.equal(0);
        
        assert.exists(config.networks);
        expect(config.networks.avalanche.url).to.equal('https://rpc.ankr.com/avalanche');
        expect(config.networks.arbitrum.url).to.equal('https://rpc.ankr.com/arbitrum');
        
        assert.exists(config.verify);
        assert.exists(config.verify.etherscan);
        expect(config.verify.etherscan.apiKey).to.equal(ETHERSCAN_KEY);
    });

});
