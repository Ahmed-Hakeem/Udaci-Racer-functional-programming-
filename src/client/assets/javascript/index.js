// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
  track_id: undefined,
  player_id: undefined,
  race_id: undefined,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  onPageLoad();
  setupClickHandlers();
});

async function onPageLoad() {
  try {
    getTracks().then((tracks) => {
      const html = renderTrackCards(tracks);
      renderAt("#tracks", html);
    });

    getRacers().then((racers) => {
      const html = renderRacerCars(racers);
      renderAt("#racers", html);
    });
  } catch (error) {
    console.log("Problem getting tracks and racers ::", error.message);
    console.error(error);
  }
}

function setupClickHandlers() {
  document.addEventListener(
    "click",
    function (event) {
      const { target } = event;
      const { parentElement } = target;

      if (parentElement.matches(".card")) target.parentElement.click();

      // Race track form field
      if (target.matches(".card.track")) {
        handleSelectTrack(target);
      }

      // Podracer form field
      if (target.matches(".card.podracer")) {
        handleSelectPodRacer(target);
      }

      // Submit create race form
      if (target.matches("#submit-create-race")) {
        event.preventDefault();

        // start race
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches("#gas-peddle")) {
        handleAccelerate(target);
      }
    },
    false
  );
}

async function delay(ms) {
  try {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    console.log(error);
  }
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

///////////////////////////////////////
///////////////////////////////////////

function handleCreateRace() {
  //Validate user inputs
  const { player_id, track_id } = store;
  if (!player_id) {
    alert("please select a racer ");
    return;
  } else if (!track_id) {
    alert("please select a racer and a track");
    return;
  }
  // Invoke the API call to create the race, then save the result
  new Promise((resolve) => {
    resolve(createRace(player_id, track_id));
  })
    .then((res) => {
      // Update the store with the race id
      store = {
        ...store,
        race_id: res.ID - 1,
      };
      return renderAt("#race", renderRaceStartView(track_id));
    })
    .then(() => {
      return runCountdown();
    })
    .then(() => {
      startRace(store.race_id);
    })
    .then(() => {
      runRace(store.race_id);
    })
    .catch((e) => {
      console.log(e);
    });
}

///////////////////////////////////////
///////////////////////////////////////

function runRace(raceID) {
  return new Promise((resolve) => {
    let raceInterval = setInterval(() => {
      new Promise((resolv) => {
        resolv(getRace(raceID));
      }).then((Race) => {
        if (Race.status === "in-progress") {
          renderAt("#leaderBoard", raceProgress(Race.positions));
        } else {
          clearInterval(raceInterval);
          renderAt("#race", resultsView(Race.positions));
          resolve(Race);
        }
      });
    }, 500);
  }).catch((error) => console.log("Problem with runRace function ->", error));
}

async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000);
    let timer = 5;

    return new Promise((resolve) => {
      countDownInterval = setInterval(() => {
        if (timer === 0) {
          clearInterval(countDownInterval);
          resolve();
          return;
        } else {
          document.getElementById("big-numbers").innerHTML = --timer;
        }
      }, 1000);
    });
  } catch (error) {
    console.log(error);
  }
}

function handleSelectTrack(target) {
  console.log("selected a track", target.id);

  const selected = document.querySelector("#tracks .selected");
  if (selected) {
    selected.classList.remove("selected");
  }

  // add class selected to current target
  target.classList.add("selected");

  store = Object.assign({}, store, { track_id: parseInt(target.id) });
}

function handleSelectPodRacer(target) {
  // remove class selected from all racer options
  const selected = document.querySelector("#racers .selected");
  if (selected) {
    selected.classList.remove("selected");
  }

  // add class selected to current target
  target.classList.add("selected");

  // Save the selected racer to the store
  store = Object.assign({}, store, { player_id: parseInt(target.id) });
}

function handleAccelerate() {
  console.log("accelerate button clicked");
  accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
  if (!racers.length) {
    return `
			<h4>Loading Racers...</4>
		`;
  }

  const results = racers.map(renderRacerCard).join("");

  return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
  const { id, driver_name, top_speed, acceleration, handling } = racer;

  return `
    <li class="card podracer" id="${id}">
  <img src="../assets/images/${id}.png" style = 'width:200px !important ; height:200px !important '>
			<h3>Driver : ${driver_name}</h3>
			<p>Top Speed : ${top_speed}</p>
			<p>Acceleration : ${acceleration}</p>
			<p>Handeling : ${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
			<h4>Loading Tracks...</4>
		`;
  }

  const results = tracks.map(renderTrackCard).join("");

  return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
  const { id, name } = track;

  return `
    <li id="${id}" class="card track">
    <img src="../assets/images/track (${id}).jpg " style = 'width:300px !important ; height:200px !important ' >
			<h3 class="track-name">${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
  return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(raceId) {
  return `
		<header style ="background-image: url('../assets/images/track (${raceId}).jpg'">
			<h1 class="header-title">Race: ${raceId}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(5)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

  return `
		<header>
			<h1 class="header-title">Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="./race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
  try {
    let userPlayer = positions.find((e) => e.id === store.player_id);
    userPlayer.driver_name += " (you)";
    positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));

    let counter = 1;

    const results = () =>
      positions.map((p) => {
        return `
  		<tr>
        <td>
        ${counter++ - 5} - ${p.driver_name}<img src="../assets/images/${
          p.id
        }.png" class='images' >
  			
  			</td>
  		</tr>
  	`;
      });
    return `
		<main id= "road">
      <h3>Leaderboard</h3>
    
      </div>
			<section id="leaderBoard" style= "display:inline-block ; ">
        ${results() ? results() : "an error occured in rendering progress part"}
			</section>
		</main>
  `;
  } catch (e) {
    console.log("err rendering progress in ::", e);
  }
}

function renderAt(element, html) {
  const node = document.querySelector(element);
  node.innerHTML = html;
}

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:8000";

function defaultFetchOpts() {
  return {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": SERVER,
    },
  };
}

// TODO - Make a fetch call (with error handling!) to each of the following API endpoints

async function getTracks() {
  try {
    const tracksResponse = await fetch(`${SERVER}/api/tracks`);
    return await tracksResponse.json();
  } catch (e) {
    console.log("error when fetching available tracks :: ", error);
  }
}

async function getRacers() {
  try {
    const response = await fetch(`${SERVER}/api/cars`);
    return await response.json();
  } catch (error) {
    console.log("error when fetching available Racers :: ", error);
  }
}

function createRace(player_id, track_id) {
  player_id = parseInt(player_id);
  Track_id = parseInt(track_id);
  const body = { player_id, Track_id };

  return fetch(`${SERVER}/api/races`, {
    method: "POST",
    ...defaultFetchOpts(),
    dataType: "jsonp",
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch((err) => console.log("Problem with createRace request::", err));
}

async function getRace(id) {
  try {
    const response = await fetch(`${SERVER}/api/races/${id}`);
    return await response.json();
  } catch (error) {
    console.log("Problem with getting Race status :: ", error);
  }
}

async function startRace(id) {
  try {
    return await fetch(`${SERVER}/api/races/${id}/start`, {
      method: "POST",
      ...defaultFetchOpts(),
    });
  } catch (error) {
    console.log("Problem with startRace request ->", error);
    window.location.replace("/");
  }
}

function accelerate(id) {
  return fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: "POST",
    ...defaultFetchOpts(),
  }).catch((error) =>
    console.log("Problem with accelerating  request :: ", error)
  );
}
