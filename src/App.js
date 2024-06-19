import React, { useState } from 'react';
import axios from 'axios';
import { BrowserProvider, Contract } from 'ethers';  // 确认导入方式

const PINATA_API_KEY = 'c21ffbb944b3b2394a71'; // 替换为你的 Pinata API Key
const PINATA_SECRET_API_KEY = '9bec974ab3926a2e9599918d63523a205f50df170f0b14bde6e444e52d005077'; // 替换为你的 Pinata Secret API Key

const contractAddress = '0x3eFFd60FC2FfDB23c6089Ba3FA53D20453bC7597'; // 替换为你自己的合约地址
const contractABI = [
  'function mintNFT(address recipient, string memory tokenURI) public returns (uint256)',
];

const App = () => {
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [ipfsHash, setIpfsHash] = useState(null);

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUploadToPinata = async () => {
    if (!file) {
      alert('Please upload an image first.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    console.log('Uploading file to Pinata...', file); // 添加日志信息
    try {
      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxBodyLength: 'Infinity', // pinata bug fix
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_API_KEY,
        },
      });
      console.log('Upload response:', res); // 添加日志信息
      const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
      setIpfsHash(url);
      console.log('IPFS URL:', url);
    } catch (error) {
      console.error('Pinata upload error:', error);
      alert('Error uploading to Pinata: ' + error.message);
    }
  };

  const handleMint = async () => {
    if (!ipfsHash) {
      alert('Please upload your image to Pinata first.');
      return;
    }

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new BrowserProvider(ethereum);
        await ethereum.request({ method: 'eth_requestAccounts' });
        const signer = await provider.getSigner(); // 确保这是异步的

        if (!signer.getAddress) {
          // ethers.js v6 中获取地址的新方式可能不同
          // 获取签名者的元数据
          const address = await signer.getAddress();
          console.log("Got address:", address);
        }

        const contract = new Contract(contractAddress, contractABI, signer);

        const recipient = await signer.getAddress();
        const tx = await contract.mintNFT(recipient, ipfsHash);
        console.log('Transaction sent, waiting for confirmation...', tx);
        await tx.wait();
        console.log('NFT Minted:', tx);
        alert('NFT Minted Successfully');

      } else {
        alert('Ethereum wallet is not connected');
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Error minting NFT: ' + error.message);
    }
  };

  return (
    <div>
      <h1>Mint Bonsai NFT</h1>
      <input type='file' accept='image/*' onChange={handleFileInput} />
      {previewImage && <img src={previewImage} alt='Preview' style={{ width: '300px', marginTop: '20px' }} />}
      <button onClick={handleUploadToPinata} style={{ display: 'block', marginTop: '20px' }}>
        Upload to Pinata
      </button>
      <button onClick={handleMint} style={{ display: 'block', marginTop: '20px' }}>
        Mint NFT
      </button>
    </div>
  );
}

export default App;

