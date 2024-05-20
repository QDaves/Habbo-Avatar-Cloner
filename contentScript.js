function createElement(tag, properties = {}, classes = []) {
    const element = document.createElement(tag);
    Object.keys(properties).forEach(prop => {
        element[prop] = properties[prop];
    });
    classes.forEach(cls => element.classList.add(cls));
    return element;
}

const link = createElement('link', {rel: 'stylesheet', type: 'text/css', href: 'style.css'});
document.head.appendChild(link);

const box = createElement('div', {}, ['box']);
const titleBar = createElement('div', {}, ['titleBar']);
const titleLabel = createElement('span', {innerText: 'Copy User'});
titleBar.appendChild(titleLabel);

const minimizeButton = createElement('button', {innerText: '-'}, ['minimizeButton']);
titleBar.appendChild(minimizeButton);
box.appendChild(titleBar);

const contentDiv = createElement('div');
const usernameInput = createElement('input', {id: 'usernameInput', placeholder: 'Enter Habbo username...'}, ['usernameInput']);
const genderSelect = createElement('select', {id: 'genderSelect'}, ['genderSelect']);
const maleOption = createElement('option', {value: 'M', text: 'Male'});
genderSelect.appendChild(maleOption);
const femaleOption = createElement('option', {value: 'F', text: 'Female'});
genderSelect.appendChild(femaleOption);

const fetchButton = createElement('button', {innerText: 'Fetch User'}, ['fetchButton']);
const changeButton = createElement('button', {innerText: 'Change Look'}, ['changeButton']);

const inputContainer = createElement('div', {}, ['inputContainer']);
inputContainer.append(usernameInput, genderSelect);

const buttonContainer = createElement('div', {}, ['buttonContainer']);
buttonContainer.append(fetchButton, changeButton);

const creditSpan = createElement('span', {innerText: 'by @QDave'}, ['creditSpan']);
contentDiv.append(inputContainer, buttonContainer, creditSpan);
box.appendChild(contentDiv);
document.body.appendChild(box);

minimizeButton.onclick = () => {
    const displayState = (contentDiv.style.display === 'none') ? 'block' : 'none';
    minimizeButton.innerText = (displayState === 'none') ? '+' : '-';
    contentDiv.style.display = displayState;
};

let isDragging = false;
let diffX, diffY, boxX, boxY;

titleBar.addEventListener('mousedown', e => {
    isDragging = true;
    [diffX, diffY] = [e.clientX, e.clientY];
    [boxX, boxY] = [box.offsetLeft, box.offsetTop];
});

document.addEventListener('mousemove', e => {
    if (isDragging) {
        const [offsetX, offsetY] = [e.clientX - diffX, e.clientY - diffY];
        box.style.left = `${boxX + offsetX}px`;
        box.style.top = `${boxY + offsetY}px`;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

fetchButton.onclick = () => {
    const username = usernameInput.value;
    fetch(`https://${location.hostname}/api/public/users?name=${username}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.figureString) {
                chrome.storage.local.set({ figureString: data.figureString });
                alert('User Outfit fetched, after Pressing Change Look you have to reload the room to see changes.');
            } else {
                alert('Failed to fetch User.');
            }
        })
        .catch(() => {
            alert('Error fetching User.');
        });
};

changeButton.onclick = () => {
    chrome.storage.local.get(['figureString'], data => {
        const figureValue = data.figureString;
        const selectedGender = genderSelect.value;
        if (figureValue) {
            const bodyData = `figure=${figureValue}&gender=${selectedGender}`;
            fetch(`https://${location.hostname}/api/user/look/save`, {
                method: "POST",
                mode: "cors",
                credentials: "include",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "sec-fetch-site": "same-origin"
                },
                body: bodyData,
                referrer: `https://${location.hostname}`,
                referrerPolicy: "strict-origin-when-cross-origin"
            })
            .then(response => response.json())
            .then(data => {
                if (data.error && data.error.text === "Too many requests in this time frame.") {
                    const nextRequestTime = new Date(data.error.nextValidRequestDate).toLocaleString();
                    alert(`Too many requests! Please try again at ${nextRequestTime}.`);
                } else {
                    alert('Change look worked!');
                }
            })
            .catch(console.error);
        } else {
            alert('No User look stored. Please fetch User first.');
        }
    });
};
