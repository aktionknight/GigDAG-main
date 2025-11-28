// Voice recognition and keyword extraction for input.html

// Voice Recognition Setup
//const speakBtn = document.getElementById('speakBtn');
const contractInput = document.getElementById('contractInput');
const speechStatus = document.getElementById('speechStatus');
let recognition;


// Replace the simple mock AI extraction function with a backend call
async function extractContractDetails(text) {
  try {
    const res = await fetch('http://localhost:3001/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const errorPayload = await res.json().catch(() => ({}));
      throw new Error(errorPayload.error || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error('AI extraction failed:', err);
    alert('AI extraction failed. Please ensure the backend is running on http://localhost:3001 and try again.');
    return {
      description: text,
      parties: '',
      deliverables: '',
      deadline: '',
      payment: '',
      milestones: '',
      penalties: ''
    };
  }
}


// Handle Next button
const nextBtn = document.getElementById('nextBtn');
nextBtn.onclick = async () => {
  const text = contractInput.value.trim();
  if (!text) {
    alert('Please enter or speak the contract terms.');
    return;
  }
  const extracted = await extractContractDetails(text);
  localStorage.setItem('contractDetails', JSON.stringify(extracted));
  window.location.href = 'contract.html';
}; 
