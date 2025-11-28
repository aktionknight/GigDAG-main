document.addEventListener('DOMContentLoaded', () => {
  const walletModal = document.getElementById('walletModal');
  const navWalletBtn = document.getElementById('navWalletBtn');
  const closeWalletBtn = document.getElementById('closeWalletModal');
  const connectMetaMaskBtn = document.getElementById('connectMetaMaskBtn');
  const statusText = document.getElementById('walletStatusText');
  const indicator = document.getElementById('walletIndicator');
  const addressDisplay = document.getElementById('walletAddressDisplay');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpModal');
  const helpLink = document.getElementById('helpLink');
  const startBtn = document.getElementById('startCreationBtn');

  if (!walletModal || !navWalletBtn) return;

  let walletConnected = false;
  let connectedWalletAddress = '';

  const setStatusUnavailable = () => {
    if (!statusText || !indicator || !connectMetaMaskBtn) return;
    statusText.innerText = 'MetaMask not installed';
    indicator.style.background = 'red';
    connectMetaMaskBtn.disabled = true;
    connectMetaMaskBtn.innerText = 'Install MetaMask';
  };

  const updateWalletUI = (isConnected, address = '') => {
    walletConnected = isConnected;
    connectedWalletAddress = address || '';

    if (statusText) {
      statusText.innerText = isConnected ? 'MetaMask Connected' : 'Not Connected';
    }
    if (indicator) {
      indicator.style.background = isConnected ? '#00ff88' : '#ff3333';
    }
    if (addressDisplay) {
      addressDisplay.innerText = isConnected && address
        ? `Account: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`
        : '';
    }
    if (connectMetaMaskBtn) {
      connectMetaMaskBtn.innerText = isConnected ? 'Connected' : 'Connect MetaMask';
      connectMetaMaskBtn.disabled = isConnected;
    }
    navWalletBtn.innerText = isConnected ? 'Wallet Connected' : 'Connect Wallet';
    navWalletBtn.classList.toggle('connected', isConnected);

    if (isConnected && address) {
      localStorage.setItem('connectedWalletAddress', address);
    } else {
      localStorage.removeItem('connectedWalletAddress');
    }
  };

  const checkWalletConnection = async () => {
    if (typeof window.ethereum === 'undefined') {
      updateWalletUI(false);
      setStatusUnavailable();
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        updateWalletUI(true, accounts[0]);
      } else {
        updateWalletUI(false);
      }
    } catch (error) {
      console.error(error);
      updateWalletUI(false);
    }
  };

  const requestWalletConnection = async (shouldCloseModal = true) => {
    if (typeof window.ethereum === 'undefined') {
      window.open('https://metamask.io/download.html', '_blank');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      updateWalletUI(true, accounts[0]);
      if (shouldCloseModal && walletModal) {
        walletModal.style.display = 'none';
      }
    } catch (error) {
      console.error('User denied account access', error);
    }
  };

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (walletConnected) {
        window.location.href = 'input.html';
        return;
      }
      walletModal.style.display = 'flex';
      requestWalletConnection(false);
    });
  }

  navWalletBtn.addEventListener('click', () => {
    walletModal.style.display = 'flex';
    if (!walletConnected) {
      requestWalletConnection(false);
    } else {
      checkWalletConnection();
    }
  });

  if (closeWalletBtn) {
    closeWalletBtn.addEventListener('click', () => {
      walletModal.style.display = 'none';
    });
  }

  if (connectMetaMaskBtn) {
    connectMetaMaskBtn.addEventListener('click', () => requestWalletConnection());
  }

  if (helpLink && helpModal) {
    helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      helpModal.style.display = 'flex';
    });
    if (closeHelpBtn) {
      closeHelpBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
      });
    }
  }

  window.addEventListener('click', (event) => {
    if (event.target === walletModal) walletModal.style.display = 'none';
    if (event.target === helpModal) helpModal.style.display = 'none';
  });

  const cachedAddress = localStorage.getItem('connectedWalletAddress');
  if (cachedAddress) {
    updateWalletUI(true, cachedAddress);
  } else {
    checkWalletConnection();
  }

  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        updateWalletUI(true, accounts[0]);
      } else {
        updateWalletUI(false);
      }
    });
  } else {
    setStatusUnavailable();
  }
});

