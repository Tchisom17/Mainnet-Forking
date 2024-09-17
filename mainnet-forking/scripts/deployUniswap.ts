
import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; 

    const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";

    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonateSigner = await ethers.getSigner(TOKEN_HOLDER);

    const designerAmountA = ethers.parseUnits("100", 6);
    const desiredAmountB = ethers.parseUnits("1000", 18);
    const amountIn = ethers.parseUnits("1000", 6); 
    const amountOutMin = ethers.parseUnits("900", 18);

    const minAmountA = ethers.parseUnits("50", 6);
    const minAmountB = ethers.parseUnits("50", 18);

    const USDC_Contract = await ethers.getContractAt("IERC20", USDC, impersonateSigner);
    const DAI_Contract = await ethers.getContractAt("IERC20", DAI, impersonateSigner);
    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonateSigner);
    const FACTORY = await ethers.getContractAt("IUniswapV2Factory", FACTORY_ADDRESS, impersonateSigner);
    const pairAddress = await FACTORY.getPair(USDC, DAI);
    const lpToken = await ethers.getContractAt("IERC20", pairAddress, impersonateSigner); 

    await USDC_Contract.approve(ROUTER_ADDRESS, ethers.MaxUint256);
    await DAI_Contract.approve(ROUTER_ADDRESS, ethers.MaxUint256);

    const usdcAllowance = await USDC_Contract.allowance(impersonateSigner.address, ROUTER_ADDRESS);
    const daiAllowance = await DAI_Contract.allowance(impersonateSigner.address, ROUTER_ADDRESS);
    console.log("USDC allowance:", usdcAllowance.toString());
    console.log("DAI allowance:", daiAllowance.toString());

    const usdcBalBefore = await USDC_Contract.balanceOf(impersonateSigner.address);
    const daiBalBefore = await DAI_Contract.balanceOf(impersonateSigner.address);

    console.log("USDC balance before swap:", Number(usdcBalBefore));
    console.log("DAI balance before swap:", Number(daiBalBefore));

    const deadline = Math.floor(Date.now() / 1000) + (60 * 60);

    await ROUTER.swapExactTokensForTokens(
        amountIn,                  
        amountOutMin,              
        [USDC, DAI],               
        impersonateSigner.address, 
        deadline                   
    );

    const usdcBalAfter = await USDC_Contract.balanceOf(impersonateSigner.address);
    const daiBalAfter = await DAI_Contract.balanceOf(impersonateSigner.address);
    console.log("=========================================================");
    console.log("USDC balance after swap:", Number(usdcBalAfter));
    console.log("DAI balance after swap:", Number(daiBalAfter));

    const usdcBal = await USDC_Contract.balanceOf(impersonateSigner.address);
    const daiBal = await DAI_Contract.balanceOf(impersonateSigner.address);
    
    console.log("USDC balance before adding liquidity:", Number(usdcBal));
    console.log("DAI balance before adding liquidity:", Number(daiBal));

    await ROUTER.addLiquidity(
        USDC,
        DAI,
        designerAmountA,
        desiredAmountB,
        minAmountA,
        minAmountB,
        TOKEN_HOLDER,
        deadline
    );

    const usdcBalAfterAddLiq = await USDC_Contract.balanceOf(impersonateSigner.address);
    const daiBalAfterAddLiq = await DAI_Contract.balanceOf(impersonateSigner.address);

    console.log("==============================")

    console.log("USDC balance after adding liquidity:", Number(usdcBalAfterAddLiq));
    console.log("DAI balance after adding liquidity:", Number(daiBalAfterAddLiq));

    const usdcBalBeforeRem = await USDC_Contract.balanceOf(impersonateSigner.address);
    const daiBalBeforeRem = await DAI_Contract.balanceOf(impersonateSigner.address);
    console.log("USDC balance before removing liquidity:", Number(usdcBalBeforeRem));
    console.log("DAI balance before removing liquidity:", Number(daiBalBeforeRem));

    const liquidity = await lpToken.balanceOf(impersonateSigner.address);
    console.log("LP Token balance before removing liquidity:", liquidity.toString());

    await lpToken.approve(ROUTER_ADDRESS, liquidity);

    await ROUTER.removeLiquidity(
        USDC,
        DAI,
        liquidity,
        minAmountA,
        minAmountB,
        TOKEN_HOLDER,
        deadline
    );

    const usdcBalAfterRem = await USDC_Contract.balanceOf(impersonateSigner.address);
    const daiBalAfterRem = await DAI_Contract.balanceOf(impersonateSigner.address);

    console.log("==============================")

    console.log("USDC balance after removing liquidity:", Number(usdcBalAfterRem));
    console.log("DAI balance after removing liquidity:", Number(daiBalAfterRem));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
