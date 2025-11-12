# Blockchain Folder - Chairman as Deployer

✅ Chairman Address: 0x3C8aAB0d6e81e6054EB9428c07996D3F71B7fBdB
This address is now the deployer (`systemAdmin`) for all smart contracts, 
including BarangayOfficials.sol.

## Deployment Steps
1. Ensure Ganache is running and the Chairman account has sufficient ETH.
2. From this folder, run:
   truffle migrate --reset --network development

3. Once done, update your backend .env file:
   CHAIN_SYSTEM_ACCOUNT=0x3C8aAB0d6e81e6054EB9428c07996D3F71B7fBdB

4. Restart backend:
   npm start

✅ The Chairman now acts as blockchain-level admin (approver), 
while the Treasurer remains the encoder in the off-chain core system.
