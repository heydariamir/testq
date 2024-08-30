const BACK4APP_ID = "VQFcSj5IJZ4eXyRfjvuxqwh39NgrYvpgF2zrspJp";
const JAVASCRIPT_KEY = "25woFPOXfGs3chs6aGZSbeWdNNWP3gudTNzIfIzs";
const SERVER_URL = "https://parseapi.back4app.com/";

const addItemForm = document.querySelector(".add-item-form");
const newItemEl = document.querySelector(".new-item-submit-btn");
const itemListEl = document.querySelector(".items");
const itemsSumEl = document.querySelector(".items__sum");
const registerBtn = document.querySelector(".header__user");
const modal = document.querySelector(".modal");
const loginForm = modal.querySelector(".user-form-login");
const signUpForm = modal.querySelector(".user-form-sign-up");
const logoutBtn = modal.querySelector(".user-logout__btn");
const addItemPriceInput = addItemForm.querySelector(".add-item__price");

// BaaS start
// Initialize Parse
Parse.initialize(BACK4APP_ID, JAVASCRIPT_KEY);
Parse.serverURL = SERVER_URL;

const formatNumber = (input) => {
	// Remove all non-numeric characters
	const numericString = input.replace(/\D/g, "");

	// Insert commas using a regular expression
	const withCommas = numericString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

	return withCommas;
};

const removeNonNumericChars = (input) => {
	return input.replace(/\D/g, "");
};

const sessionCheck = () => {
	Parse.Session.current()
		.then((session) => {
			// Session is valid
			console.log("Current session is valid:", session);

			// Get the User object from the session and fetch to retrieve more information
			const user = session.get("user");
			return user.fetch(); // Make sure the user object is fully fetched with all attributes
		})
		.then((user) => {
			// The user is now fully fetched, and you can access the username
			const username = user.getUsername();
			const userWelcomeEl = document.querySelector(
				".header__user-welcome"
			);
			const userTitleEl = userWelcomeEl.querySelector(
				".header__user-title"
			);
			console.log("Username from the current session:", username);
			userWelcomeEl.style.display = "revert";
			userTitleEl.textContent = username;
			modal.setAttribute("data-is-signed-in", "true");
		})
		.catch((error) => {
			// Session is invalid, perhaps because the user is not logged in or the session has expired
			console.error("Current session is invalid:", error);

			// Optional: Handle invalid session, e.g. redirect to login page
		});
};

const signUp = (email, username, password) => {
	(async () => {
		const user = new Parse.User();
		user.set("username", username);
		user.set("email", email);
		user.set("password", password);

		try {
			let userResult = await user.signUp();
			console.log("User signed up", userResult);
		} catch (error) {
			console.error("Error while signing up user", error);
		}
	})();
};

const login = (username, password) => {
	(async () => {
		try {
			// Pass the username and password to logIn function
			let user = await Parse.User.logIn(username, password);
			// Do stuff after successful login
			console.log("Logged in user", user);
			sessionCheck();
			initialRender();
			modal.setAttribute("data-active", false);
		} catch (error) {
			console.error("Error while logging in user", error);
		}
	})();
};

const logoutBtnHandler = () => {
	Parse.User.logOut()
		.then(() => {
			// The user is now logged out
			console.log("The user has been logged out.");
			clearList();
			renderPrice();
			modal.setAttribute("data-is-signed-in", "false");
			const userWelcomeEl = document.querySelector(
				".header__user-welcome"
			);
			const userTitleEl = userWelcomeEl.querySelector(
				".header__user-title"
			);
			userWelcomeEl.style.display = "none";
			userTitleEl.textContent = "";
		})
		.catch((error) => {
			// There was an error logging out the user
			console.error("Error logging out the user:", error);
		});
};

const getItems = () => {
	return itemListEl.querySelectorAll(".items-container");
};

const calculateNumberOfItems = () => {
	const items = getItems();
	const itemsLen = items.length;

	return itemsLen;
};

const renderPrice = () => {
	const items = getItems();

	let price = 0;
	for (const item of items) {
		const currentPrice = +removeNonNumericChars(
			item.querySelector(".item__price").textContent
		);
		price += currentPrice;
	}

	const itemSumEl = itemListEl.querySelector(".items__sum__price");

	itemSumEl.textContent = formatNumber(price.toString());
};

const initialRender = () => {
	const currentUser = Parse.User.current();
	if (!currentUser) {
		return;
	}

	const query = new Parse.Query("Item");
	// No need to query for ACL; Parse automatically filters results based on the user's permissions.

	query
		.find()
		.then((items) => {
			// The results will only include objects that the current user has permission to read
			items.forEach((item) => {
				// Access column values using get("<ColumnName>")
				const title = item.get("title");
				const desc = item.get("desc");
				const price = item.get("price");
				const date = item.get("date");
				const time = item.get("time");
				const id = item.id;

				renderNewItem({ title, desc, price, date, time, id });
			});
		})
		.catch((error) => {
			console.error("Error fetching objects:", error);
		});
};

const renderNewItem = (datas) => {
	const numberOfItems = calculateNumberOfItems();
	const itemsTemplateEl = document.querySelector(".items-container-template");
	const itemEl = document.importNode(itemsTemplateEl.content, true);
	const itemElContainer = itemEl.querySelector(".items-container");
	const emptyListEl = itemListEl.querySelector(".empty-list");

	itemElContainer.setAttribute("data-item-id", datas.id);
	itemEl.querySelector(".item__number").textContent = numberOfItems + 1;
	itemEl.querySelectorAll(".item__title").forEach((item) => {
		item.textContent = datas.title;
	});
	itemEl.querySelector(".item__desc").textContent = datas.desc;
	itemEl.querySelectorAll(".item__price").forEach((item) => {
		item.textContent = formatNumber(datas.price);
	});
	itemEl.querySelector(".item__date").textContent = datas.date;
	itemEl.querySelector(".item__time").textContent = datas.time;

	if (emptyListEl) {
		itemListEl.removeChild(emptyListEl);
	}

	itemListEl.insertBefore(itemEl, itemsSumEl);

	renderPrice();
};

const createItemOnServer = (datas) => {
	const currentUser = Parse.User.current();

	if (!currentUser) {
		alert("User is Not Logged In!");
		return;
	}

	const Item = Parse.Object.extend("Item");

	const item = new Item();

	item.set("title", datas.title);
	item.set("desc", datas.desc);
	item.set("price", datas.price);
	item.set("date", datas.date);
	item.set("time", datas.time);

	const acl = new Parse.ACL(currentUser);

	acl.setReadAccess(currentUser, true);
	acl.setWriteAccess(currentUser, true);

	item.setACL(acl);

	item.save()
		.then(function (item) {
			console.log("Item created successfully");

			datas.id = item.id;

			renderNewItem(datas);

			const clearBtn = document.querySelector(".new-item-clear-btn");
			clearBtn.click();
		})
		.catch(function (error) {
			console.log("Error: " + error.message);
		});

	const query = new Parse.Query("Item");
	// No need to query for ACL; Parse automatically filters results based on the user's permissions.

	query
		.find()
		.then((results) => {
			// The results will only include objects that the current user has permission to read
			console.log("Objects retrieved for the current user", results);
		})
		.catch((error) => {
			console.error("Error fetching objects:", error);
		});
};

const newItemHandler = (event) => {
	event.preventDefault();
	const titleEl = addItemForm.querySelector(".add-item__name");
	const descEl = addItemForm.querySelector(".add-item__desc");
	const priceEl = addItemForm.querySelector(".add-item__price");
	const dateEl = addItemForm.querySelector(".add-item__date");
	const [dateValue, timeValue] = dateEl.value.split(" ");

	const datas = {
		title: titleEl.value,
		desc: descEl.value,
		price: priceEl.value,
		date: dateValue,
		time: timeValue,
	};

	createItemOnServer(datas);
};

const reRenderItemsNumber = (currentItem) => {
	const items = Array.from(currentItem.parentElement.children);
	const itemNumber = items.indexOf(currentItem);

	const nextsiblings = document.querySelectorAll(
		`.items-container:nth-child(${itemNumber + 1}) ~ .items-container`
	);

	let currentItemNumber = itemNumber;
	nextsiblings.forEach((element) => {
		const itemNumberEl = element.querySelector(".item__number");
		itemNumberEl.textContent = currentItemNumber;
		++currentItemNumber;
	});
};

const emptyListNoteAdder = () => {
	const emptyListTemplateEl = document.querySelector(".empty-list-template");
	const emptyListEl = document.importNode(emptyListTemplateEl.content, true);

	itemListEl.insertBefore(emptyListEl, itemsSumEl);
};

const removeItem = (item) => {
	reRenderItemsNumber(item);

	item.parentElement.removeChild(item);

	renderPrice();
	if (calculateNumberOfItems() < 1) {
		emptyListNoteAdder();
	}
};

const removeItemOnServer = (itemEl, itemId) => {
	const Item = Parse.Object.extend("Item");
	const item = new Item();
	item.id = itemId;

	item.destroy()
		.then(() => {
			console.log("The object was deleted from the Parse server.");
			removeItem(itemEl);
		})
		.catch((error) => {
			console.error("Error while deleting object:", error);
		});
};

const itemListHandler = (event) => {
	const selectedElement = event.target;

	if (selectedElement.closest(".item-remove-btn")) {
		const item = selectedElement.closest(".items-container");
		const itemId = item.getAttribute("data-item-id");
		removeItemOnServer(item, itemId);
		return;
	}

	const itemExpandEl = selectedElement.closest(".item__expand");

	if (!itemExpandEl) {
		return;
	}

	const item = itemExpandEl.closest(".items-container");

	if (item.getAttribute("data-expanded") === "false") {
		item.setAttribute("data-expanded", "true");
	} else if (item.getAttribute("data-expanded") === "true") {
		item.setAttribute("data-expanded", "false");
	}
};

const clearList = () => {
	const itemsEl = itemListEl.querySelectorAll(".items-container");
	itemsEl.forEach((itemEl) => itemEl.parentElement.removeChild(itemEl));
	renderPrice();
};

const modalHandler = (event) => {
	const clickedEl = event.target;
	if (clickedEl === event.currentTarget) {
		modal.setAttribute("data-active", false);
		document.body.style["overflow"] = "revert";
		return;
	}

	const formType = clickedEl.getAttribute("data-form-type");
	if (formType === "login" || formType === "sign-up") {
		const signUpForm = modal.querySelector(".user-form-sign-up");
		const loginForm = modal.querySelector(".user-form-login");

		signUpForm.classList.toggle("invisible");
		loginForm.classList.toggle("invisible");
	}
};

const registerUserHandler = () => {
	modal.setAttribute("data-active", "true");

	document.body.style["overflow"] = "hidden";
};

const loginFormHandler = (event) => {
	event.preventDefault();
	const form = event.currentTarget;
	const username = form.querySelector(".input--username").value;
	const password = form.querySelector(".input--password").value;

	login(username, password);
};

const signUpFormHandler = (event) => {
	event.preventDefault();
	const form = event.currentTarget;
	const email = form.querySelector(".input--email").value;
	const username = form.querySelector(".input--username").value;
	const password = form.querySelector(".input--password").value;
	const repeatedPassword = form.querySelector(
		".input--password-repeat"
	).value;

	signUp(email, username, password);
};

const itemPriceChangeHandler = () => {
	console.log("hi");
	const inputValue = addItemPriceInput.value;
	addItemPriceInput.value = formatNumber(inputValue);
};

addItemForm.addEventListener("submit", newItemHandler);
loginForm.addEventListener("submit", loginFormHandler);
signUpForm.addEventListener("submit", signUpFormHandler);
itemListEl.addEventListener("click", itemListHandler);
registerBtn.addEventListener("click", registerUserHandler);
modal.addEventListener("click", modalHandler);
logoutBtn.addEventListener("click", logoutBtnHandler);
addItemPriceInput.addEventListener("input", itemPriceChangeHandler);

sessionCheck();
jalaliDatepicker.startWatch({ time: true, showCloseBtn: true });
initialRender();
