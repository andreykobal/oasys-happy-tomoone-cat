import React, { useState } from 'react';
import Web3 from 'web3';
import contractABI from './ContractABI';
import { NFTStorage, File, Blob } from 'nft.storage';

const NFT_STORAGE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEQ4RmZGNTk4ZjE5NjQ5NTY0RjRFZmY4RjBlNEVFYTU4NDQ2OUNGRjIiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY1NzMwMjQ2ODYwMywibmFtZSI6InRlbmsifQ.ZgqRfmAB3F_Sj6DCKZtGx-vPojcq_ZwLyyKyvbrnXnM'; // Put your token here

function MintNFT() {
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [attributes, setAttributes] = useState([]); // You'll have to build an interface to manage this array
  const [imageFile, setImageFile] = useState(null);
  const [animationFile, setAnimationFile] = useState(null);

  const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

  const handleFileChange = (event, setFile) => {
    const file = event.target.files[0];
    setFile(file);
  };

  const uploadFileToIPFS = async (file) => {
    const blob = new Blob([file]);
    const cid = await client.storeBlob(blob);
    return `https://ipfs.io/ipfs/${cid}`;
  };

  const mintToken = async () => {
    if (window.ethereum) {
      try {
        // Upload files
        const imageURL = await uploadFileToIPFS(imageFile);
        const animationURL = await uploadFileToIPFS(animationFile);

        // Construct metadata
        const metadata = {
          description,
          external_url: "https://ailand.app/",
          image: imageURL,
          name,
          animation_url: animationURL,
          attributes
        };

        // Upload metadata
        const metadataBlob = new Blob([JSON.stringify(metadata)]);
        const metadataCID = await client.storeBlob(metadataBlob);
        const tokenURI = `https://ipfs.io/ipfs/${metadataCID}`;

        // Continue with your minting process
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3 = new Web3(window.ethereum);

        const contractAddress = '0x1Dfcb33950422020c93dA6Cb0aB5e7c70Ce1a79C';
        const contract = new web3.eth.Contract(contractABI, contractAddress);

        const gasEstimate = await contract.methods.mintItem(tokenURI).estimateGas({ from: accounts[0] });
        const gasPriceWei = '1500000000';

        const transaction = contract.methods.mintItem(tokenURI).send({
          from: accounts[0],
          gas: gasEstimate,
          gasPrice: gasPriceWei
        });

        transaction.on('transactionHash', function(hash){
          console.log('Transaction Hash:', hash);
        });

        await transaction;

        alert('Token Minted!');
      } catch (error) {
        console.error("Error minting token: ", error);
        alert("Error minting token");
      }
    } else {
      alert('Ethereum not detected! Please install and setup MetaMask.');
    }
  };

  return (
    <div>
      <h2>Mint Your NFT</h2>
      <div>
        <label>Description:</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <label>Name:</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} />
      </div>
      {/* Add interface for attributes here */}
      <div>
        <label>Image:</label>
        <input type="file" onChange={e => handleFileChange(e, setImageFile)} />
      </div>
      <div>
        <label>Animation:</label>
        <input type="file" onChange={e => handleFileChange(e, setAnimationFile)} />
      </div>
      <button onClick={mintToken}>Mint</button>
    </div>
  );
}

export default MintNFT;