// ============================================================
// EcoLens AI - Carbon Footprint Calculator
// Compatible with current EcoLens calculator.html
// AWS Lambda connection preserved
// ============================================================

const AWS_API_URL =
    "https://x2dog4o446.execute-api.us-east-1.amazonaws.com/default/ecolens-backend";
const BEDROCK_COACH_ENABLED = false;
document.addEventListener("DOMContentLoaded", function () {

    console.log("EcoLens calculator.js loaded successfully.");

    // ============================================================
    // HELPER: FIND ELEMENT USING MULTIPLE POSSIBLE IDs
    // ============================================================

    function getElement(...ids) {
        for (const id of ids) {
            const element = document.getElementById(id);
            if (element) return element;
        }
        return null;
    }

    function getValue(...ids) {
        const element = getElement(...ids);
        return element ? element.value : "";
    }

    function getNumber(...ids) {
        const value = getValue(...ids);
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }

    // ============================================================
    // MAIN ELEMENTS
    // ============================================================

    const calculateBtn =
        getElement("btn-calculate");

    const resultsWrapper =
        getElement("results-wrapper");

    const formError =
        getElement("form-error");

    const resetBtn =
        getElement("btn-reset-calc");

    const clearHistoryBtn =
        getElement("btn-clear-history");

    if (!calculateBtn) {

        console.error(
            "EcoLens: Calculate button not found."
        );

        return;
    }

    // ============================================================
    // COOKING FUEL
    // ============================================================

    const cookingFuelSelect =
        getElement("cooking-fuel");

    const cookingFrequencySelect =
        getElement(
            "cooking-frequency",
            "cooking-fuel-frequency"
        );

    function updateCookingOptions() {

        if (
            !cookingFuelSelect ||
            !cookingFrequencySelect
        ) {
            return;
        }

        const fuel =
            cookingFuelSelect.value;

        // --------------------------------------------------------
        // LPG
        // --------------------------------------------------------

        if (fuel === "lpg") {

            cookingFrequencySelect.innerHTML = `

                <option value="" disabled selected>
                    Select refill frequency
                </option>

                <option value="monthly">
                    About once a month
                </option>

                <option value="two_months">
                    About once every 2 months
                </option>

                <option value="three_months">
                    About once every 3 months
                </option>

                <option value="four_plus_months">
                    Less often
                </option>

            `;
        }

        // --------------------------------------------------------
        // ELECTRIC COOKING
        // --------------------------------------------------------

        else if (fuel === "electric") {

            cookingFrequencySelect.innerHTML = `

                <option value="medium" selected>
                    Normal use
                </option>

            `;
        }

        // --------------------------------------------------------
        // OTHER FUELS
        // --------------------------------------------------------

        else {

            cookingFrequencySelect.innerHTML = `

                <option value="" disabled selected>
                    Select usual use
                </option>

                <option value="low">
                    Low use
                </option>

                <option value="medium">
                    Average use
                </option>

                <option value="high">
                    High use
                </option>

            `;
        }
    }

    if (cookingFuelSelect) {

        cookingFuelSelect.addEventListener(
            "change",
            updateCookingOptions
        );
    }

    // Only change options if this is the new version.
    if (cookingFrequencySelect) {
        updateCookingOptions();
    }

    // ============================================================
    // WATER RANGE
    // ============================================================

    function getWaterLitres() {

        const waterElement =
            getElement(
                "water-use-range",
                "water-level",
                "water-litres"
            );

        if (!waterElement) {
            console.warn(
                "EcoLens: Water field not found."
            );

            return 450;
        }

        const value =
            waterElement.value || "";

        const text =
            waterElement.options &&
            waterElement.selectedIndex >= 0
                ? waterElement.options[
                    waterElement.selectedIndex
                  ].text.toLowerCase()
                : "";

        // --------------------------------------------------------
        // If it is an old number input
        // --------------------------------------------------------

        if (
            waterElement.type === "number"
        ) {

            return Number(value) || 0;
        }

        // --------------------------------------------------------
        // New range values
        // --------------------------------------------------------

        if (
            value === "low" ||
            value === "less" ||
            value === "0-300"
        ) {
            return 250;
        }

        if (
            value === "medium" ||
            value === "normal" ||
            value === "typical" ||
            value === "301-600"
        ) {
            return 450;
        }

        if (
            value === "high" ||
            value === "601-900"
        ) {
            return 750;
        }

        if (
            value === "excessive" ||
            value === "900+" ||
            value === "more"
        ) {
            return 1000;
        }

        // --------------------------------------------------------
        // Check displayed text as a backup.
        // This makes the calculator work even if the
        // option values are different.
        // --------------------------------------------------------

        if (
            text.includes("0–300") ||
            text.includes("0-300") ||
            text.includes("up to 300") ||
            text.includes("less")
        ) {
            return 250;
        }

        if (
            text.includes("301–600") ||
            text.includes("301-600") ||
            text.includes("typical") ||
            text.includes("normal")
        ) {
            return 450;
        }

        if (
            text.includes("601–900") ||
            text.includes("601-900")
        ) {
            return 750;
        }

        if (
            text.includes("900+") ||
            text.includes("more than 900") ||
            text.includes("excessive")
        ) {
            return 1000;
        }

        // Safe default
        return 450;
    }

    // ============================================================
    // ELECTRICITY BILL → ESTIMATED kWh
    // ============================================================

    function convertBillToKWh(bill) {

        if (bill <= 0) {
            return 0;
        }

        /*
         * This is an ESTIMATE.
         *
         * Example used in the interface:
         *
         * ₹1,000–₹2,000 ≈ 125–250 kWh/month
         *
         * Therefore:
         *
         * ₹1000 / 8 ≈ 125 kWh
         * ₹2000 / 8 ≈ 250 kWh
         *
         * Actual kWh can differ because electricity tariffs,
         * slabs and fixed charges differ by location.
         */

        return bill / 8;
    }

    // ============================================================
    // COOKING FUEL → LEGACY AMOUNT
    // ============================================================

    function getCookingAmount(
        fuel,
        frequency
    ) {

        // --------------------------------------------------------
        // LPG
        // --------------------------------------------------------

        if (fuel === "lpg") {

            const cylinders = {

                monthly:
                    1,

                two_months:
                    0.5,

                three_months:
                    1 / 3,

                four_plus_months:
                    0.2
            };

            return (
                cylinders[frequency] || 0.5
            ) * 14.2;
        }

        // --------------------------------------------------------
        // ELECTRIC
        // --------------------------------------------------------

        if (fuel === "electric") {

            return 0;
        }

        // --------------------------------------------------------
        // OTHER FUELS
        // --------------------------------------------------------

        const usage = {

            low:
                10,

            medium:
                20,

            high:
                30
        };

        return (
            usage[frequency] || 20
        );
    }

    // ============================================================
    // GET WASTE
    // ============================================================

    function getWaste() {

        const wasteElement =
            getElement(
                "waste-kg",
                "waste-level"
            );

        if (!wasteElement) {
            return 0;
        }

        // New version uses kg/week.
        if (
            wasteElement.type === "number"
        ) {

            return Number(
                wasteElement.value
            ) || 0;
        }

        // If a future version uses ranges,
        // convert them automatically.

        const value =
            wasteElement.value;

        if (value === "low") {
            return 5;
        }

        if (
            value === "medium" ||
            value === "normal"
        ) {
            return 10;
        }

        if (
            value === "high" ||
            value === "excessive"
        ) {
            return 15;
        }

        return 0;
    }

    // ============================================================
    // CALCULATE BUTTON
    // ============================================================

    calculateBtn.addEventListener(
        "click",
        async function () {

            console.log(
                "Calculate My Footprint clicked."
            );

            if (formError) {

                formError.style.display =
                    "none";
            }

            // ----------------------------------------------------
            // TRANSPORT
            // ----------------------------------------------------

            const vehicle =
                getValue(
                    "vehicle-type"
                );

            const transportDistance =
                getNumber(
                    "transport-distance"
                );

            // ----------------------------------------------------
            // ELECTRICITY
            // ----------------------------------------------------

            const electricityBill =
                getNumber(
                    "electricity-bill",
                    "electricity-amount"
                );

            const electricityKWh =
                getNumber(
                    "electricity-kwh"
                ) ||
                convertBillToKWh(
                    electricityBill
                );

            // ----------------------------------------------------
            // COOKING
            // ----------------------------------------------------

            const cookingFuel =
                getValue(
                    "cooking-fuel"
                );

            const cookingFrequency =
                getValue(
                    "cooking-frequency",
                    "cooking-fuel-frequency"
                );

            const cookingFuelAmount =
                getNumber(
                    "cooking-fuel-amount"
                ) ||
                getCookingAmount(
                    cookingFuel,
                    cookingFrequency
                );

            // ----------------------------------------------------
            // WASTE
            // ----------------------------------------------------

            const waste =
                getWaste();

            // ----------------------------------------------------
            // WATER
            // ----------------------------------------------------

            const water =
                getWaterLitres();

            // ----------------------------------------------------
            // DIET
            // ----------------------------------------------------

            const dietElement =
                document.querySelector(
                    'input[name="diet"]:checked'
                );

            const diet =
                dietElement
                    ? dietElement.value
                    : "";

            // ----------------------------------------------------
            // FLIGHTS
            // ----------------------------------------------------

            const flightCount =
                getNumber(
                    "flight-count"
                );

            const flightDuration =
                getValue(
                    "flight-duration"
                ) ||
                "none";

            // ====================================================
            // VALIDATION
            // ====================================================

            /*
             * IMPORTANT:
             *
             * Do NOT check electricityKWh as a required
             * user input.
             *
             * The user enters the electricity BILL.
             *
             * Do NOT check water litres as a user input.
             *
             * The user chooses a WATER RANGE.
             */

            const missingFields = [];

            if (!vehicle) {

                missingFields.push(
                    "vehicle"
                );
            }

            if (
                transportDistance < 0
            ) {

                missingFields.push(
                    "travel distance"
                );
            }

            if (!cookingFuel) {

                missingFields.push(
                    "cooking fuel"
                );
            }

            if (!cookingFrequency) {

                missingFields.push(
                    "cooking fuel usage"
                );
            }

            if (!diet) {

                missingFields.push(
                    "diet"
                );
            }

            if (
                flightCount < 0
            ) {

                missingFields.push(
                    "flight count"
                );
            }

            /*
             * Air travel is optional.
             *
             * If the user enters 0 flights,
             * "No flights" is completely valid.
             */

            if (
                flightCount > 0 &&
                (
                    !flightDuration ||
                    flightDuration === "none"
                )
            ) {

                missingFields.push(
                    "flight duration"
                );
            }

            if (
                missingFields.length > 0
            ) {

                if (formError) {

                    formError.style.display =
                        "block";

                    formError.innerText =
                        "Please fill in: " +
                        missingFields.join(", ") +
                        ".";

                    formError.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "center"
                    });
                }

                console.error(
                    "Missing fields:",
                    missingFields
                );

                return;
            }

            // ====================================================
            // DATA SENT TO AWS
            // ====================================================

            const userData = {

                // Transportation
                vehicle:
                    vehicle,

                transport_distance_km:
                    transportDistance,

                transport:
                    transportDistance,

                // Electricity
                electricity_kwh:
                    electricityKWh,

                electricity:
                    electricityKWh,

                electricity_bill:
                    electricityBill,

                // Cooking
                cooking_fuel:
                    cookingFuel,

                cooking_frequency:
                    cookingFrequency,

                cooking_fuel_amount:
                    cookingFuelAmount,

                // Waste
                waste_kg_per_week:
                    waste,

                waste:
                    waste,

                // Water
                water_litres_per_day:
                    water,

                water:
                    water,

                // Food
                diet:
                    diet,

                // Flights
                flight_count:
                    flightCount,

                flight_duration:
                    flightDuration,

                flights:
                    flightCount
            };

            console.log(
                "EcoLens data:",
                userData
            );

            // ====================================================
            // BUTTON LOADING
            // ====================================================

            const originalButtonText =
                calculateBtn.innerHTML;

            calculateBtn.disabled =
                true;

            calculateBtn.innerHTML =
                "Calculating... " +
                "<span style='font-size:18px;'>⏳</span>";

            try {

                // =================================================
                // LOCAL CALCULATION
                // =================================================

                const local =
                    calculateLocalBreakdown(
                        userData
                    );

                let transportation =
                    local.transportation;

                let electricity =
                    local.electricity;

                let household =
                    local.household;

                let waterCO2 =
                    local.water;

                let food =
                    local.food;

                let flights =
                    local.flights;

                let source =
                    "EcoLens Engine";

                // =================================================
                // AWS LAMBDA
                // =================================================

                try {

                    const response =
                        await fetch(
                            AWS_API_URL,
                            {
                                method:
                                    "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        userData
                                    )
                            }
                        );

                    console.log(
                        "AWS response status:",
                        response.status
                    );

                    if (response.ok) {

                        const raw =
                            await response.text();

                        console.log(
                            "AWS response:",
                            raw
                        );

                        try {

                            let data =
                                JSON.parse(
                                    raw
                                );

                            if (
                                data.body &&
                                typeof data.body ===
                                    "string"
                            ) {

                                try {

                                    data =
                                        JSON.parse(
                                            data.body
                                        );

                                } catch (e) {}
                            }

                            source =
                                data.source ||
                                "Powered by AWS Lambda";

                        } catch (e) {

                            console.warn(
                                "AWS returned non-JSON response."
                            );
                        }
                    }

                } catch (awsError) {

                    console.warn(
                        "AWS unavailable. " +
                        "Using EcoLens local calculation.",
                        awsError
                    );
                }

                // =================================================
                // TOTAL
                // =================================================

                const total =
                    transportation +
                    electricity +
                    household +
                    waterCO2 +
                    food +
                    flights;

                // =================================================
                // DISPLAY
                // =================================================

                displayResults({

                    total:
                        total,

                    transportation:
                        transportation,

                    electricity:
                        electricity,

                    household:
                        household,

                    water:
                        waterCO2,

                    food:
                        food,

                    flights:
                        flights,

                    source:
                        source
                });

                // =================================================
                // SHOW RESULTS
                // =================================================

                if (resultsWrapper) {

                    resultsWrapper.style.display =
                        "block";

                    setTimeout(
                        function () {

                            resultsWrapper.scrollIntoView({
                                behavior:
                                    "smooth",

                                block:
                                    "start"
                            });

                        },
                        200
                    );
                }

                // =================================================
                // SAVE HISTORY
                // =================================================

                saveCalculation({

                    timestamp:
                        new Date().toISOString(),

                    inputs:
                        userData,

                    result: {

                        total:
                            total,

                        transportation:
                            transportation,

                        electricity:
                            electricity,

                        household:
                            household,

                        water:
                            waterCO2,

                        food:
                            food,

                        flights:
                            flights
                    }
                });

                renderHistory();

            } catch (error) {

                console.error(
                    "EcoLens calculation error:",
                    error
                );

                if (formError) {

                    formError.style.display =
                        "block";

                    formError.innerHTML =
                        "<strong>" +
                        "Unable to complete calculation." +
                        "</strong><br>" +
                        error.message;
                }

            } finally {

                calculateBtn.disabled =
                    false;

                calculateBtn.innerHTML =
                    originalButtonText;
            }
        }
    );

    // ============================================================
    // LOCAL CARBON CALCULATION
    // ============================================================

    function calculateLocalBreakdown(
        data
    ) {

        // --------------------------------------------------------
        // TRANSPORT
        // --------------------------------------------------------

        const transportFactors = {

            car:
                0.18,

            electric:
                0.05,

            bus:
                0.08,

            train:
                0.04,

            auto:
                0.10,

            bike:
                0.09,

            walk:
                0
        };

        const transportation =
            (
                data.transport_distance_km ||
                0
            ) *
            (
                transportFactors[
                    data.vehicle
                ] || 0
            );

        // --------------------------------------------------------
        // ELECTRICITY
        // --------------------------------------------------------

        const electricity =
            (
                data.electricity_kwh ||
                0
            ) *
            0.71;

        // --------------------------------------------------------
        // COOKING FUEL
        // --------------------------------------------------------

        /*
         * LPG:
         *
         * One 14.2 kg cylinder ≈
         * 42.6 kg CO2e.
         */

        const lpgCylinders = {

            monthly:
                1,

            two_months:
                0.5,

            three_months:
                1 / 3,

            four_plus_months:
                0.2
        };

        let householdFuel =
            0;

        if (
            data.cooking_fuel ===
            "lpg"
        ) {

            householdFuel =
                (
                    lpgCylinders[
                        data.cooking_frequency
                    ] || 0.5
                ) *
                42.6;

        } else if (
            data.cooking_fuel ===
            "electric"
        ) {

            // Already included in electricity.
            householdFuel =
                0;

        } else {

            const otherFuel = {

                png: {
                    low:
                        18,

                    medium:
                        30,

                    high:
                        45
                },

                biogas: {
                    low:
                        3,

                    medium:
                        5,

                    high:
                        8
                },

                firewood: {
                    low:
                        20,

                    medium:
                        35,

                    high:
                        50
                },

                charcoal: {
                    low:
                        15,

                    medium:
                        25,

                    high:
                        40
                },

                kerosene: {
                    low:
                        12,

                    medium:
                        22,

                    high:
                        35
                },

                other: {
                    low:
                        12,

                    medium:
                        22,

                    high:
                        35
                }
            };

            const fuelData =
                otherFuel[
                    data.cooking_fuel
                ];

            if (fuelData) {

                householdFuel =
                    fuelData[
                        data.cooking_frequency
                    ] || 20;
            }
        }

        // --------------------------------------------------------
        // WASTE
        // --------------------------------------------------------

        const waste =
            (
                data.waste_kg_per_week ||
                0
            ) *
            4.33 *
            0.50;

        // --------------------------------------------------------
        // HOUSEHOLD
        // --------------------------------------------------------

        const household =
            householdFuel +
            waste;

        // --------------------------------------------------------
        // WATER
        // --------------------------------------------------------

        const water =
            (
                data.water_litres_per_day ||
                0
            ) *
            30 *
            0.0003;

        // --------------------------------------------------------
        // FOOD
        // --------------------------------------------------------

        const foodFactors = {

            vegetarian:
                45,

            mixed:
                70,

            "non-vegetarian":
                100
        };

        const food =
            foodFactors[
                data.diet
            ] || 0;

        // --------------------------------------------------------
        // FLIGHTS
        // --------------------------------------------------------

        const flightFactors = {

            none:
                0,

            short:
                250,

            medium:
                600,

            long:
                1200
        };

        const flights =
            (
                (
                    data.flight_count ||
                    0
                ) *
                (
                    flightFactors[
                        data.flight_duration
                    ] || 0
                )
            ) /
            12;

        return {

            transportation:
                transportation,

            electricity:
                electricity,

            household:
                household,

            water:
                water,

            food:
                food,

            flights:
                flights
        };
    }

    // ============================================================
    // DISPLAY RESULTS
    // ============================================================

    function displayResults(
        result
    ) {

        const transportation =
            Number(
                result.transportation
            ) || 0;

        const electricity =
            Number(
                result.electricity
            ) || 0;

        const household =
            Number(
                result.household
            ) || 0;

        const water =
            Number(
                result.water
            ) || 0;

        const food =
            Number(
                result.food
            ) || 0;

        const flights =
            Number(
                result.flights
            ) || 0;

        const total =
            transportation +
            electricity +
            household +
            water +
            food +
            flights;

        // --------------------------------------------------------
        // TOTAL
        // --------------------------------------------------------

        setText(
            "res-total-value",
            total.toFixed(1)
        );

        const annualTons =
            (
                total *
                12
            ) /
            1000;

        setText(
            "res-annual-value",
            annualTons.toFixed(2)
        );

        // --------------------------------------------------------
        // CATEGORY VALUES
        // --------------------------------------------------------

        setText(
            "val-transport",
            transportation.toFixed(1)
        );

        setText(
            "val-electricity",
            electricity.toFixed(1)
        );

        setText(
            "val-household",
            household.toFixed(1)
        );

        setText(
            "val-water",
            water.toFixed(1)
        );

        setText(
            "val-food",
            food.toFixed(1)
        );

        setText(
            "val-flights",
            flights.toFixed(1)
        );

        // ========================================================
        // IMPACT BREAKDOWN
        // ========================================================

        const categories = {

            transportation:
                transportation,

            electricity:
                electricity,

            household:
                household,

            water:
                water,

            food:
                food,

            flights:
                flights
        };

        const names = {

            transportation:
                "Transportation",

            electricity:
                "Electricity",

            household:
                "Household & Waste",

            water:
                "Water",

            food:
                "Food & Diet",

            flights:
                "Air Travel"
        };

        // --------------------------------------------------------
        // BIGGEST CATEGORY
        // --------------------------------------------------------

        let biggestCategory =
            "transportation";

        let biggestValue =
            -1;

        Object.keys(
            categories
        ).forEach(
            function (category) {

                if (
                    categories[category] >
                    biggestValue
                ) {

                    biggestValue =
                        categories[category];

                    biggestCategory =
                        category;
                }
            }
        );

        // --------------------------------------------------------
        // PERCENTAGES
        // --------------------------------------------------------

        Object.keys(
            categories
        ).forEach(
            function (category) {

                const value =
                    categories[
                        category
                    ];

                const percentage =
                    total > 0
                        ? (
                            value /
                            total
                          ) *
                          100
                        : 0;

                setText(
                    `pct-${category}`,
                    `${percentage.toFixed(0)}%`
                );

                let barId;

                if (
                    category ===
                    "transportation"
                ) {

                    barId =
                        "bar-transport";

                } else {

                    barId =
                        `bar-${category}`;
                }

                const bar =
                    document.getElementById(
                        barId
                    );

                if (bar) {

                    bar.style.width =
                        `${Math.min(
                            100,
                            Math.max(
                                0,
                                percentage
                            )
                        )}%`;
                }
            }
        );

        // --------------------------------------------------------
        // BIGGEST CONTRIBUTOR
        // --------------------------------------------------------

        const biggestPercentage =
            total > 0
                ? (
                    biggestValue /
                    total
                  ) *
                  100
                : 0;

        setText(
            "res-biggest-name",
            names[biggestCategory]
        );

        setText(
            "res-biggest-percent",
            `${biggestPercentage.toFixed(0)}%`
        );

        setText(
            "res-biggest-desc",
            getBiggestDescription(
                biggestCategory
            )
        );

        // --------------------------------------------------------
        // INSIGHT
        // --------------------------------------------------------

        const insight =
            document.getElementById(
                "res-insight"
            );

        if (insight) {

            insight.innerHTML =
                `
                <strong>
                    Your biggest opportunity is
                    ${names[biggestCategory]}.
                </strong>
                <br>
                This category contributes approximately
                <strong>
                    ${biggestPercentage.toFixed(0)}%
                </strong>
                of your estimated footprint.
                `;
        }

        // --------------------------------------------------------
        // COACH
        // --------------------------------------------------------

        displayRecommendations(
            biggestCategory,
            result
        );

        // --------------------------------------------------------
        // SIMULATOR
        // --------------------------------------------------------

        setupSimulator(
            total,
            transportation,
            electricity
        );
    }

    // ============================================================
    // BIGGEST CONTRIBUTOR DESCRIPTION
    // ============================================================

    function getBiggestDescription(
        category
    ) {

        const descriptions = {

            transportation:
                "Your travel activity is currently your largest estimated contributor.",

            electricity:
                "Your electricity consumption is currently your largest estimated contributor.",

            household:
                "Cooking fuel and household waste are currently your largest estimated contributors.",

            water:
                "Your household water use is currently your largest estimated contributor.",

            food:
                "Your dietary choices are currently your largest estimated contributor.",

            flights:
                "Air travel is currently your largest estimated contributor."
        };

        return (
            descriptions[category] ||
            "This is currently your largest estimated contributor."
        );
    }

    // ============================================================
    // SUSTAINABILITY COACH
    // ============================================================

    function displayRecommendations(
        biggestCategory,
        result
    ) {

        const container =
            document.getElementById(
                "coach-recs-list"
            );

        if (!container) {
            return;
        }

        const recommendations = {

            transportation: [

                "Use public transport for regular journeys whenever possible.",

                "Carpool with friends or colleagues.",

                "Walk or cycle for short-distance trips.",

                "Combine multiple errands into one trip."
            ],

            electricity: [

                "Switch off lights, fans and appliances when they are not needed.",

                "Reduce unnecessary air-conditioner usage.",

                "Use LED bulbs and energy-efficient appliances.",

                "Make better use of natural daylight."
            ],

            household: [

                "Reduce unnecessary household waste.",

                "Separate recyclable and non-recyclable waste.",

                "Reuse items instead of replacing them immediately.",

                "Avoid unnecessary single-use products."
            ],

            water: [

                "Avoid wasting water during bathing and cleaning.",

                "Fix leaking taps and pipes.",

                "Use water-efficient fixtures.",

                "Do not leave taps running unnecessarily."
            ],

            food: [

                "Reduce food waste by planning meals.",

                "Include more plant-based meals when practical.",

                "Prefer local and seasonal food.",

                "Store food properly to reduce waste."
            ],

            flights: [

                "Use trains or other ground transport for suitable shorter journeys.",

                "Avoid unnecessary flights when another option exists.",

                "Combine trips where possible.",

                "Prefer direct flights when practical."
            ]
        };

        const list =
            recommendations[
                biggestCategory
            ] ||
            recommendations.household;

        container.innerHTML = `

            <div class="recommendation-intro">

                <h4>
                    🌱 Your Personalized Sustainability Action Plan
                </h4>

                <p>
                    Based on your footprint,
                    <strong>
                        ${getBiggestDescriptionName(
                            biggestCategory
                        )}
                    </strong>
                    is your biggest contributor.
                    Here are some practical actions:
                </p>

            </div>

            <div class="recommendation-list">

              ${list.map((item) => `
    <div class="recommendation-item">
        <div><strong>${item}</strong></div>
    </div>
`).join("")}

            </div>
        `;

        const previewTag =
            document.querySelector(
                ".preview-tag"
            );

        if (previewTag) {
           previewTag.textContent = "Smart AI · Personalized";
        }
        const intro =
            document.querySelector(
                ".coach-intro"
            );

        if (intro) {

            intro.textContent =
    "EcoLens analyzes your footprint and creates personalized actions based on your biggest contributor.";
        }

        if (BEDROCK_COACH_ENABLED) {
            requestBedrockRecommendations(
                result,
                container,
                previewTag
            );
        }
    }

    async function requestBedrockRecommendations(
        result,
        container,
        previewTag
    ) {
        try {
            const response = await fetch(AWS_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "coach",
                    total_kg: result.total,
                    breakdown: {
                        transportation: result.transportation,
                        electricity: result.electricity,
                        household: result.household,
                        water: result.water,
                        food: result.food,
                        flights: result.flights
                    }
                })
            });

            let data = await response.json();
            if (typeof data.body === "string") {
                data = JSON.parse(data.body);
            }
            if (!response.ok) {
                throw new Error(data.error || `Bedrock request failed (${response.status}).`);
            }

            if (
                !Array.isArray(data.recommendations) ||
                data.recommendations.length === 0 ||
                !data.recommendations.every((item) => typeof item === "string")
            ) {
                throw new Error("Bedrock returned an invalid recommendation list.");
            }

            const recommendationList = document.createElement("div");
            recommendationList.className = "recommendation-list";
            for (const recommendation of data.recommendations) {
                const item = document.createElement("div");
                item.className = "recommendation-item";
                const text = document.createElement("strong");
                text.textContent = recommendation;
                item.appendChild(text);
                recommendationList.appendChild(item);
            }

            const oldList = container.querySelector(".recommendation-list");
            if (oldList) {
                oldList.replaceWith(recommendationList);
            } else {
                container.appendChild(recommendationList);
            }

            if (previewTag) {
                previewTag.textContent = data.source || "Powered by Amazon Bedrock";
            }
        } catch (error) {
            console.error("EcoLens Bedrock coach error:", error);
            if (previewTag) {
                previewTag.textContent = "Bedrock unavailable - showing local recommendations";
            }
        }
    }

    function getBiggestDescriptionName(
        category
    ) {

        const names = {

            transportation:
                "Transportation",

            electricity:
                "Electricity",

            household:
                "Household & Waste",

            water:
                "Water",

            food:
                "Food & Diet",

            flights:
                "Air Travel"
        };

        return (
            names[category] ||
            category
        );
    }

    // ============================================================
    // WHAT-IF SIMULATOR
    // ============================================================

    function setupSimulator(
        currentTotal,
        currentTransport,
        currentElectricity
    ) {

        const transportSlider =
            document.getElementById(
                "sim-transport-slider"
            );

        const electricitySlider =
            document.getElementById(
                "sim-electricity-slider"
            );

        if (
            !transportSlider ||
            !electricitySlider
        ) {
            return;
        }

        const originalDistance =
            getNumber(
                "transport-distance"
            );

        const originalElectricity =
            getNumber(
                "electricity-kwh"
            ) ||
            convertBillToKWh(
                getNumber(
                    "electricity-bill"
                )
            );

        transportSlider.value =
            Math.min(
                2000,
                originalDistance
            );

        electricitySlider.value =
            Math.min(
                1000,
                originalElectricity
            );

        function updateSimulator() {

            const newDistance =
                Number(
                    transportSlider.value
                );

            const newElectricity =
                Number(
                    electricitySlider.value
                );

            const transportPerKm =
                originalDistance > 0
                    ? (
                        currentTransport /
                        originalDistance
                      )
                    : 0;

            const electricityPerKWh =
                originalElectricity > 0
                    ? (
                        currentElectricity /
                        originalElectricity
                      )
                    : 0;

            const simulatedTransport =
                newDistance *
                transportPerKm;

            const simulatedElectricity =
                newElectricity *
                electricityPerKWh;

            const simulatedTotal =
                currentTotal -
                currentTransport -
                currentElectricity +
                simulatedTransport +
                simulatedElectricity;

            const reduction =
                currentTotal -
                simulatedTotal;

            setText(
                "sim-distance-val",
                newDistance
            );

            setText(
                "sim-electricity-val",
                newElectricity.toFixed(0)
            );

            setText(
                "sim-current-val",
                `${currentTotal.toFixed(1)} kg`
            );

            setText(
                "sim-new-val",
                `${Math.max(
                    0,
                    simulatedTotal
                ).toFixed(1)} kg`
            );

            setText(
                "sim-diff-val",
                `${Math.max(
                    0,
                    reduction
                ).toFixed(1)} kg`
            );
        }

        transportSlider.oninput =
            updateSimulator;

        electricitySlider.oninput =
            updateSimulator;

        updateSimulator();
    }

    // ============================================================
    // HISTORY
    // ============================================================

    function saveCalculation(
        calculation
    ) {

        try {

            const history =
                JSON.parse(
                    localStorage.getItem(
                        "ecolens_history"
                    ) || "[]"
                );

            history.unshift(
                calculation
            );

            localStorage.setItem(
                "ecolens_history",
                JSON.stringify(
                    history.slice(
                        0,
                        10
                    )
                )
            );

        } catch (error) {

            console.warn(
                "Could not save history:",
                error
            );
        }
    }

    function renderHistory() {

        const container =
            document.getElementById(
                "history-container"
            );

        if (!container) {
            return;
        }

        let history = [];

        try {

            history =
                JSON.parse(
                    localStorage.getItem(
                        "ecolens_history"
                    ) || "[]"
                );

        } catch (error) {

            history = [];
        }

        if (
            history.length === 0
        ) {

            container.innerHTML =
                "<p>No previous calculations yet.</p>";

            return;
        }

        container.innerHTML =
            history.map(
                function (item, index) {

                    const date =
                        new Date(
                            item.timestamp
                        ).toLocaleString();

                    const total =
                        Number(
                            item.result?.total
                        ) || 0;

                    return `

                        <div class="history-item">

                            <strong>
                                Calculation
                                ${history.length - index}
                            </strong>

                            <span>
                                ${date}
                            </span>

                            <strong>
                                ${total.toFixed(1)}
                                kg CO₂e/month
                            </strong>

                        </div>

                    `;
                }
            ).join("");
    }

    // ============================================================
    // CLEAR HISTORY
    // ============================================================

    if (clearHistoryBtn) {

        clearHistoryBtn.addEventListener(
            "click",
            function () {

                localStorage.removeItem(
                    "ecolens_history"
                );

                renderHistory();
            }
        );
    }

    // ============================================================
    // RESET
    // ============================================================

    if (resetBtn) {

        resetBtn.addEventListener(
            "click",
            function () {

                const form =
                    document.getElementById(
                        "footprint-form"
                    );

                if (form) {
                    form.reset();
                }

                if (resultsWrapper) {

                    resultsWrapper.style.display =
                        "none";
                }

                updateCookingOptions();

                window.scrollTo({

                    top:
                        0,

                    behavior:
                        "smooth"
                });
            }
        );
    }

    // ============================================================
    // INITIAL HISTORY
    // ============================================================

    renderHistory();

    console.log(
        "EcoLens calculator initialized successfully."
    );

});