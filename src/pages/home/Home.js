import React, {useState, useEffect} from 'react'
import idl from '../../idl.json'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import kp from '../../keypair.json'

// SystemProgram -> reference to the Solana runtime
const { SystemProgram, Keypair } = web3;

// keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

const Home = () => {
    const [inputValue, setInputValue] = useState('');
    const [walletAddress, setWalletAddress] = useState(null);
    const [gifList, setGifList] = useState([]);
  
  // get GifList -> from solana block chain
  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      setGifList(account.gifList)
    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }
  
    // Actions
    const checkIfWalletIsConnected = async () => {
      try {
        const { solana } = window;
    
        if (solana) {
          if (solana.isPhantom) {
            console.log('Phantom wallet found!');
            const response = await solana.connect({ onlyIfTrusted: true });
            console.log(
              'Connected with Public Key:',
              response.publicKey.toString()
            );
    
            /*
             * Set the user's publicKey in state to be used later!
             */
            setWalletAddress(response.publicKey.toString());
          }
        } else {
          alert('Solana object not found! Get a Phantom Wallet 👻');
        }
      } catch (error) {
        console.error(error);
      }
    };
  
    const connectWallet = async () => {
      const { solana } = window;
    
      if (solana) {
        const response = await solana.connect();
        console.log('Connected with Public Key:', response.publicKey.toString());
        setWalletAddress(response.publicKey.toString());
      }
    };
  
    const sendGif = async () => {
      if (inputValue.length === 0) {
        console.log("No gif link given!")
        return
      }
      setInputValue('');
      console.log('Gif link:', inputValue);
      try {
        const provider = getProvider();
        const program = new Program(idl, programID, provider);
    
        await program.rpc.addGif(inputValue, {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
          },
        });
      //  console.log("GIF successfully sent to program", inputValue)
    
        await getGifList();
      } catch (error) {
        console.log("Error sending GIF:", error)
      }
    };
  
    const onInputChange = (event) => {
      const { value } = event.target;
      setInputValue(value);
    };
  
    const getProvider = () => {
      const connection = new Connection(network, opts.preflightCommitment);
      const provider = new Provider(
        connection, window.solana, opts.preflightCommitment,
      );
      return provider;
    }
  
  
    const createGifAccount = async () => {
      try {
        const provider = getProvider();
        const program = new Program(idl, programID, provider);
        console.log("ping")
        await program.rpc.startStuffOff({
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          },
          signers: [baseAccount]
        });
       // console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
        await getGifList();
    
      } catch(error) {
        console.log("Error creating BaseAccount account:", error)
      }
    }
  
  
    const renderConnectedContainer = () => {
      // means the program account hasn't been initialized.
        if (gifList === null) {
          return (
            <div className="connected-container">
              <button className="cta-button submit-gif-button" onClick={createGifAccount}>
                Do One-Time Initialization For GIF Program Account
              </button>
            </div>
          )
        } 
        // Otherwise, Account exists. User can submit GIFs.
        else {
          return(
            <div className="connected-container">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendGif();
                }}
              >
                <input
                  type="text"
                  placeholder="Enter gif link!"
                  value={inputValue}
                  onChange={onInputChange}
                />
                <button type="submit" className="cta-button submit-gif-button">
                  Submit
                </button>
              </form>
              <div className="gif-grid">
               
                {gifList.map((item, index) => (
                  <div className="gif-item" key={index}>
                    <img src={item.gifLink} alt="gif-img" />
                  </div>
                ))}
              </div>
            </div>
          )
        }
      }
  
    const renderNotConnectedContainer = () => (
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Connect to Wallet
      </button>
    );
  
   
    useEffect(() => {
      const onLoad = async () => {
        await checkIfWalletIsConnected();
      };
      window.addEventListener('load', onLoad);
      return () => window.removeEventListener('load', onLoad);
    }, []);
  
  
    useEffect(() => {
      if (walletAddress) {
       // console.log('Fetching GIF list...');
        getGifList()
      }
    }, [walletAddress]);
  
    
  return (
      <>
    <div className={walletAddress ? 'authed-container' : 'container'}>
    <div className="header-container">
      <p className="header">Web3 Pubilc GIF Board</p>
      <p className="sub-text">
        Upload a gif for everyone on Web3 to see :)
      </p>
      {/*  condition to show this only if we don't have a wallet address */}
      {!walletAddress && renderNotConnectedContainer()}
    {walletAddress && renderConnectedContainer()}
    </div>
  </div>
  </>
  )
}

export default Home