/* ==========================================================================
   KINETIC // Elite Stateful Developer Portfolio Engine
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------------------------------------
    // 1. Persistent State: Case Studies Archive (LocalStorage CRUD)
    // ---------------------------------------------------------
    const DEFAULT_PROJECTS = [
        { id: 1, name: "Skeuomorphic Analog Synth Pad", date: "2026", status: "Active", category: "audio" },
        { id: 2, name: "Orion Canvas Exhaust Particles", date: "2025", status: "Completed", category: "creative" },
        { id: 3, name: "Displacement Map Vector Grids", date: "2026", status: "Active", category: "creative" },
        { id: 4, name: "Spatial Audio Synth Keyboard Relays", date: "2025", status: "Completed", category: "audio" },
        { id: 5, name: "Kinetic Neomorphic UI Dashboard", date: "2026", status: "Completed", category: "creative" }
    ];

    let projects = [];
    let currentCategory = "all"; // active tab filter

    // Load projects from LocalStorage
    function loadProjects() {
        const stored = localStorage.getItem("kinetic_projects");
        if (stored) {
            projects = JSON.parse(stored);
        } else {
            projects = [...DEFAULT_PROJECTS];
            saveProjects();
        }
        renderProjects();
        updateGraph();
    }

    // Save projects to LocalStorage
    function saveProjects() {
        localStorage.setItem("kinetic_projects", JSON.stringify(projects));
    }

    // Render Case Studies Table
    const tableBody = document.querySelector(".table-neo tbody");

    function renderProjects() {
        if (!tableBody) return;
        tableBody.innerHTML = "";

        // Filter projects by category
        const filtered = projects.filter(p => {
            if (currentCategory === "all") return true;
            return p.category === currentCategory;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #4b5461; font-weight: 600; padding: 24px;">No case studies synced in this category. Click 'SYNC NEW SIGNAL' to form new items.</td></tr>`;
            return;
        }

        filtered.forEach((project) => {
            const row = document.createElement("tr");
            row.setAttribute("data-id", project.id);
            row.style.transition = "all 0.4s ease";
            
            let statusClass = "online";
            if (project.status === "Active") statusClass = "online";
            else if (project.status === "Completed") statusClass = "badge-status"; // premium gray style

            row.innerHTML = `
                <td>${project.name}</td>
                <td>${project.date}</td>
                <td class="status-col"><span class="badge-status ${statusClass}">${project.status}</span></td>
                <td class="actions-col">
                    <button class="row-action-btn" title="Run systems check"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
                    <button class="row-delete-btn" title="Dismantle archive"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        bindRowActionListeners();
    }


    // ---------------------------------------------------------
    // 2. Reactive SVG Sparkline Graph Generation
    // ---------------------------------------------------------
    const sparklineSvg = document.querySelector(".sparkline-svg");

    function updateGraph() {
        if (!sparklineSvg) return;

        // Clear existing vertices
        const circles = sparklineSvg.querySelectorAll("circle");
        circles.forEach(c => c.remove());

        // Get currently filtered list of projects to update graph reactively!
        const filtered = projects.filter(p => {
            if (currentCategory === "all") return true;
            return p.category === currentCategory;
        });

        const N = filtered.length;
        if (N === 0) {
            setGraphPaths("M 0,40 L 200,40", "M 0,80 L 0,40 L 200,40 L 200,80 Z");
            return;
        }

        const width = 200;
        const colWidth = N > 1 ? width / (N - 1) : width;
        const points = [];

        filtered.forEach((project, idx) => {
            const x = colWidth * idx;
            
            // Map statuses: Active = 25px (high velocity), Completed = 55px (mid stable)
            let y = 55;
            if (project.status === "Active") y = 25;
            
            points.push({ x, y });

            // Create individual glowing circle nodes
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", x);
            circle.setAttribute("cy", y);
            circle.setAttribute("r", "4");
            circle.setAttribute("fill", "#f7d1ba");
            circle.setAttribute("filter", "url(#molten-glow)");
            sparklineSvg.appendChild(circle);
        });

        // Form outline stroke path
        let strokeD = `M ${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            strokeD += ` L ${points[i].x},${points[i].y}`;
        }

        // Form gradient fill shadow path
        const fillD = `M 0,80 ` + points.map(p => `L ${p.x},${p.y}`).join(" ") + ` L 200,80 Z`;

        setGraphPaths(strokeD, fillD);
    }

    function setGraphPaths(strokeD, fillD) {
        const paths = sparklineSvg.querySelectorAll("path");
        if (paths.length >= 2) {
            paths[0].setAttribute("d", fillD); // Shadow gradient fill
            paths[1].setAttribute("d", strokeD); // Glowing stroke line
        }
    }


    // ---------------------------------------------------------
    // 3. Web Audio API Space Synthesizer (Volume Slider)
    // ---------------------------------------------------------
    let audioCtx = null;
    let oscBase = null;
    let oscFifth = null;
    let masterGain = null;
    let warmFilter = null;
    let emergencyInterval = null;

    function initSynthesizer() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Master gain controller
            masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(0, audioCtx.currentTime);

            // Biquad lowpass filter for deep cosmic rumble
            warmFilter = audioCtx.createBiquadFilter();
            warmFilter.type = "lowpass";
            warmFilter.frequency.setValueAtTime(220, audioCtx.currentTime);
            warmFilter.Q.setValueAtTime(1.5, audioCtx.currentTime);

            // Base Sub-oscillator A1
            oscBase = audioCtx.createOscillator();
            oscBase.type = "sawtooth";
            oscBase.frequency.setValueAtTime(55, audioCtx.currentTime); // 55Hz

            // Harmonious Fifth Oscillator E2
            oscFifth = audioCtx.createOscillator();
            oscFifth.type = "triangle";
            oscFifth.frequency.setValueAtTime(82.4, audioCtx.currentTime); // 82.4Hz

            // Node connections
            oscBase.connect(warmFilter);
            oscFifth.connect(warmFilter);
            warmFilter.connect(masterGain);
            masterGain.connect(audioCtx.destination);

            oscBase.start();
            oscFifth.start();
        } catch (err) {
            console.error("Web Audio API failed to load:", err);
        }
    }

    function updateSynthVolume(percent) {
        if (!audioCtx) initSynthesizer();
        if (!audioCtx || !masterGain || !warmFilter) return;

        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }

        // Map percentage to soft gain values (max 10% volume)
        const targetGain = (percent / 100) * 0.1;
        masterGain.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 0.05);

        // Adjust Biquad filter frequency: slider opens high frequencies!
        const cutOffFreq = 180 + (percent * 3.5);
        warmFilter.frequency.linearRampToValueAtTime(cutOffFreq, audioCtx.currentTime + 0.08);

        // Subtly shift pitch
        const basePitchFreq = 55 + (percent * 0.1);
        oscBase.frequency.linearRampToValueAtTime(basePitchFreq, audioCtx.currentTime + 0.1);
        oscFifth.frequency.linearRampToValueAtTime(basePitchFreq * 1.5, audioCtx.currentTime + 0.1);
    }

    // Alarm Sound loop for reality fracture easter egg!
    function startAlarmSound() {
        if (!audioCtx || !oscBase || !oscFifth || !warmFilter) return;
        
        let up = true;
        emergencyInterval = setInterval(() => {
            if (audioCtx && oscBase) {
                // Pitch sweep alarm!
                const targetFreq = up ? 80 : 40;
                oscBase.frequency.linearRampToValueAtTime(targetFreq, audioCtx.currentTime + 0.29);
                oscFifth.frequency.linearRampToValueAtTime(targetFreq * 1.5, audioCtx.currentTime + 0.29);
                warmFilter.frequency.linearRampToValueAtTime(up ? 600 : 300, audioCtx.currentTime + 0.29);
                up = !up;
            }
        }, 300);
    }

    function stopAlarmSound() {
        if (emergencyInterval) {
            clearInterval(emergencyInterval);
            emergencyInterval = null;
        }
        // Restore standard pitch frequency
        if (audioCtx && oscBase && oscFifth) {
            const sliderVal = parseInt(sliderValueLabel.textContent);
            const basePitchFreq = 55 + (sliderVal * 0.1);
            oscBase.frequency.linearRampToValueAtTime(basePitchFreq, audioCtx.currentTime + 0.5);
            oscFifth.frequency.linearRampToValueAtTime(basePitchFreq * 1.5, audioCtx.currentTime + 0.5);
        }
    }


    // ---------------------------------------------------------
    // 4. Strict Neomorphic Email Validator
    // ---------------------------------------------------------
    const emailField = document.getElementById("email-address");

    if (emailField) {
        emailField.addEventListener("blur", () => {
            const val = emailField.value.trim();
            const wrapper = emailField.closest(".input-neo-wrapper");

            if (val === "") {
                wrapper.classList.remove("invalid-state-wrapper");
                emailField.classList.remove("invalid");
                return;
            }

            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (regex.test(val)) {
                wrapper.classList.remove("invalid-state-wrapper");
                emailField.classList.remove("invalid");
                spawnToast("success", "Sender Verified", "Encryption link stabilized.");
            } else {
                wrapper.classList.add("invalid-state-wrapper");
                emailField.classList.add("invalid");
                spawnToast("error", "Format Alert", "Sender node email address mismatch.");
            }
        });
    }


    // ---------------------------------------------------------
    // 5. Contact Signal Sender (Transmission Persistence)
    // ---------------------------------------------------------
    const sendSignalBtn = document.getElementById("send-signal-btn");
    const messageField = document.getElementById("transmission-message");

    if (sendSignalBtn && emailField && messageField) {
        sendSignalBtn.addEventListener("click", () => {
            const email = emailField.value.trim();
            const message = messageField.value.trim();

            if (email === "" || message === "") {
                spawnToast("warning", "Transmission Blocked", "Please verify both node address and message fields are populated.");
                return;
            }

            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regex.test(email)) {
                spawnToast("error", "Verification Mismatch", "Unable to establish contact. Sender node invalid.");
                return;
            }

            // Save signal message in LocalStorage Inbox
            const inbox = JSON.parse(localStorage.getItem("kinetic_inbox") || "[]");
            inbox.push({ email, message, date: new Date().toLocaleString() });
            localStorage.setItem("kinetic_inbox", JSON.stringify(inbox));

            // Dynamically add a nice live signal feed toast to the stack!
            spawnToast("success", "Signal Inbound", `Encrypting transmission from ${email.substring(0, 8)}...`);
            
            setTimeout(() => {
                spawnToast("success", "Signal Cataloged", `"${message.substring(0, 20)}..." logged successfully into local archives.`);
            }, 800);

            // Reset message field
            messageField.value = "";
        });
    }


    // ---------------------------------------------------------
    // 6. Sliding Tabs Categorized Filter Glider
    // ---------------------------------------------------------
    const tabsContainer = document.getElementById("tabs-bar-container");
    const tabs = document.querySelectorAll(".tab-neo-item");
    const glider = document.getElementById("tab-glow-glider");

    function updateGlider(activeTab) {
        if (!activeTab || !glider) return;
        const containerRect = tabsContainer.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();

        const relativeLeft = tabRect.left - containerRect.left;
        
        glider.style.left = `${relativeLeft}px`;
        glider.style.width = `${tabRect.width}px`;
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            tabs.forEach(t => t.classList.remove("active"));
            e.target.classList.add("active");
            
            // Set tab filter state!
            currentCategory = e.target.getAttribute("data-tab");
            renderProjects();
            updateGraph(); // recalculate graph!

            updateGlider(e.target);
            spawnToast("success", "Archive Filtered", `Displaying repository category: ${e.target.textContent}`);
        });
    });

    const initialActiveTab = document.querySelector(".tab-neo-item.active");
    if (initialActiveTab) {
        setTimeout(() => updateGlider(initialActiveTab), 150);
    }

    window.addEventListener("resize", () => {
        const currentActive = document.querySelector(".tab-neo-item.active");
        if (currentActive) updateGlider(currentActive);
    });


    // ---------------------------------------------------------
    // 7. Interactive Elevation Stack (Foundations)
    // ---------------------------------------------------------
    const elevateBtn = document.getElementById("raise-stack-btn");
    const stack = document.getElementById("elevation-stack");

    if (elevateBtn && stack) {
        elevateBtn.addEventListener("click", () => {
            stack.classList.toggle("elevated");
            if (stack.classList.contains("elevated")) {
                elevateBtn.textContent = "Collapse Stack";
                elevateBtn.style.color = "var(--rose-gold-light)";
                elevateBtn.style.borderColor = "rgba(247, 209, 186, 0.3)";
            } else {
                elevateBtn.textContent = "Expand Stack";
                elevateBtn.style.color = "#9da8b6";
                elevateBtn.style.borderColor = "rgba(255,255,255,0.03)";
            }
        });
    }


    // ---------------------------------------------------------
    // 8. Interactive Submit Button (State Transition)
    // ---------------------------------------------------------
    const submitBtn = document.getElementById("interactive-submit-btn");

    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            const originalText = submitBtn.textContent;
            
            submitBtn.disabled = true;
            submitBtn.className = "btn-molten-pressed loading-loop";
            submitBtn.innerHTML = `<div class="spinner-ring"></div> TRANSMITTING...`;

            spawnToast("success", "Ping Dispatched", "Encryption ping dispatched to main terminal.");

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.className = "btn-molten-primary";
                submitBtn.innerHTML = originalText;
            }, 3000);
        });
    }


    // ---------------------------------------------------------
    // 9. Interactive Volume Slider Drag Handlers
    // ---------------------------------------------------------
    const sliderBg = document.getElementById("slider-track-bg");
    const sliderThumb = document.getElementById("slider-thumb-drag");
    const sliderFill = document.getElementById("slider-fill-level");
    const sliderValueLabel = document.getElementById("slider-percentage-val");

    if (sliderBg && sliderThumb && sliderFill) {
        let isDragging = false;

        function updateSliderValue(clientX) {
            const trackRect = sliderBg.getBoundingClientRect();
            let percent = ((clientX - trackRect.left) / trackRect.width) * 100;
            
            percent = Math.max(0, Math.min(100, percent));
            const roundedVal = Math.round(percent);

            sliderThumb.style.left = `${percent}%`;
            sliderFill.style.width = `${percent}%`;
            if (sliderValueLabel) {
                sliderValueLabel.textContent = `${roundedVal}%`;
            }

            // Sync with spatial synthesizer!
            updateSynthVolume(percent);
        }

        // Mouse Events
        sliderThumb.addEventListener("mousedown", (e) => {
            isDragging = true;
            document.body.style.userSelect = "none";
            e.preventDefault();
        });

        sliderBg.addEventListener("mousedown", (e) => {
            isDragging = true;
            updateSliderValue(e.clientX);
            document.body.style.userSelect = "none";
        });

        document.addEventListener("mousemove", (e) => {
            if (isDragging) updateSliderValue(e.clientX);
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = "";
            }
        });

        // Touch Events (for mobile)
        sliderThumb.addEventListener("touchstart", (e) => {
            isDragging = true;
            e.preventDefault();
        });

        document.addEventListener("touchmove", (e) => {
            if (isDragging && e.touches[0]) {
                updateSliderValue(e.touches[0].clientX);
            }
        });

        document.addEventListener("touchend", () => {
            isDragging = false;
        });
    }


    // ---------------------------------------------------------
    // 10. Automatic Molten Progress Bar Loop
    // ---------------------------------------------------------
    const progressBar = document.getElementById("interactive-progress-bar");
    const progressLabel = document.getElementById("progress-val-label");

    if (progressBar && progressLabel) {
        let currentProgress = 60;
        
        setInterval(() => {
            currentProgress += (Math.random() * 4 - 1.5);
            if (currentProgress >= 100) {
                currentProgress = 10;
            } else if (currentProgress < 5) {
                currentProgress = 5;
            }
            
            const displayVal = Math.round(currentProgress);
            progressBar.style.width = `${currentProgress}%`;
            progressLabel.textContent = `${displayVal}%`;
        }, 800);
    }


    // ---------------------------------------------------------
    // 11. Modal Confirmation: Reality Fracture Easter-Egg!
    // ---------------------------------------------------------
    const deleteModal = document.getElementById("delete-modal-overlay");
    const triggerBtn = document.getElementById("trigger-delete-modal-btn");
    const triggerSidebar = document.getElementById("open-delete-modal-sidebar");
    const closeBtn = document.getElementById("close-delete-modal-btn");
    const confirmBtn = document.getElementById("confirm-delete-modal-btn");
    const mainWrapper = document.getElementById("main-portfolio-wrapper");

    let projectToDeleteId = null;

    function openModal() {
        if (deleteModal) {
            deleteModal.classList.add("show");
            isModalActive = true;
            spawnModalSmoke();
        }
    }

    function closeModal() {
        if (deleteModal) {
            deleteModal.classList.remove("show");
            isModalActive = false;
            projectToDeleteId = null; // Clear queue
            
            // Reset modal texts in case they were modified for specific task delete
            document.getElementById("modal-title-label").textContent = "FRACTURE REALITY MATRIX?";
            document.getElementById("modal-body-desc").textContent = "This action is highly volatile. Fracturing the matrix destabilizes the portfolio visual color variables, shifting accent light frequencies from Rose Gold to Crimson and shaking the space interface.";
            confirmBtn.textContent = "FRACTURE";
            confirmBtn.className = "modal-btn-neo delete-danger";
        }
    }

    if (triggerBtn) triggerBtn.addEventListener("click", openModal);
    if (triggerSidebar) triggerSidebar.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    
    if (confirmBtn) {
        confirmBtn.addEventListener("click", () => {
            if (projectToDeleteId !== null) {
                // specific row dismantle
                const targetRow = document.querySelector(`.table-neo tbody tr[data-id="${projectToDeleteId}"]`);
                if (targetRow) {
                    targetRow.style.opacity = "0";
                    targetRow.style.transform = "translateY(-10px)";
                    setTimeout(() => {
                        projects = projects.filter(p => p.id !== projectToDeleteId);
                        saveProjects();
                        renderProjects();
                        updateGraph();
                    }, 400);
                }
                spawnToast("error", "Repository Dismantled", "Specified creative case study dissolved from local archives.");
                closeModal();
            } else {
                // REALITY FRACTURE EASTER EGG FUSION FRACTURE!
                closeModal();
                
                // 1. Shaking effect on main wrapper
                mainWrapper.classList.add("fractured-shake");
                
                // 2. Color shift class override to red warning
                mainWrapper.classList.add("emergency-theme");
                
                // 3. Audio Synth Warning Alarm activation!
                if (!audioCtx) initSynthesizer();
                updateSynthVolume(80); // Ensure active sound
                startAlarmSound();

                spawnToast("error", "FRACTURE IMMINENT", "Emergency vectors activated. Crimson alarms active.");

                // Cooler restoring stabilizers after 5 seconds
                setTimeout(() => {
                    mainWrapper.classList.remove("fractured-shake");
                    mainWrapper.classList.remove("emergency-theme");
                    stopAlarmSound();
                    
                    // Sync synth audio level back to volume slider
                    const sliderVal = parseInt(sliderValueLabel.textContent);
                    updateSynthVolume(sliderVal);

                    spawnToast("success", "Reality Restabilized", "Cooling complete. Visual vectors returned to rose-gold spectrum.");
                }, 5000);
            }
        });
    }


    // ---------------------------------------------------------
    // 12. Dynamic S-Step Process Interactivity
    // ---------------------------------------------------------
    const stepNodes = document.querySelectorAll(".step-node");
    const stepActiveLine = document.querySelector(".step-line-active");
    const stepTitle = document.querySelector(".step-title-display");
    const stepCanvas = document.getElementById("step-smoke-canvas");

    const stepInfo = [
        { percentage: "0%", title: "STEP 1: INITIATION", label: "Establish secure connection" },
        { percentage: "33%", title: "STEP 2: IDEATION", label: "Map structural parameters" },
        { percentage: "66%", title: "STEP 3: SYNTHESIS", label: "Confirm details below" },
        { percentage: "100%", title: "STEP 4: DEPLOYMENT", label: "Upload structural archives" }
    ];

    stepNodes.forEach((node, idx) => {
        node.style.cursor = "pointer";
        node.addEventListener("click", () => {
            stepNodes.forEach((n, nIdx) => {
                n.classList.remove("active-glow", "cracked-smoke");
                if (nIdx < idx) {
                    n.classList.add("completed");
                    n.classList.remove("pending");
                } else if (nIdx === idx) {
                    n.classList.remove("completed", "pending");
                    n.classList.add("active-glow", "cracked-smoke");
                } else {
                    n.classList.remove("completed", "active-glow", "cracked-smoke");
                    n.classList.add("pending");
                }
            });

            if (stepActiveLine) stepActiveLine.style.width = stepInfo[idx].percentage;
            if (stepTitle) stepTitle.textContent = stepInfo[idx].title;

            // Restructure canvas nodes inside active steps
            const oldLargeDot = document.querySelector(".node-dot-large");
            if (oldLargeDot) {
                const parent = oldLargeDot.parentNode;
                const newNormalDot = document.createElement("div");
                newNormalDot.className = "node-dot";
                parent.replaceChild(newNormalDot, oldLargeDot);
            }

            const normalDot = node.querySelector(".node-dot");
            if (normalDot) {
                const newLargeDot = document.createElement("div");
                newLargeDot.className = "node-dot-large";
                newLargeDot.innerHTML = `<div class="cracked-core"></div>`;
                newLargeDot.appendChild(stepCanvas);
                node.replaceChild(newLargeDot, normalDot);
            }

            let floatTag = document.querySelector(".step-floating-tag");
            if (floatTag) {
                node.appendChild(floatTag);
                floatTag.textContent = stepInfo[idx].label;
            }

            spawnToast("warning", `Phase Shift: Step ${idx+1}`, `Navigated to ${stepInfo[idx].title}`);
        });
    });


    // ---------------------------------------------------------
    // 13. Case Study Pagination Droplets
    // ---------------------------------------------------------
    const pagButtons = document.querySelectorAll(".pagination-neo-flex .num-btn");
    const prevBtn = document.querySelector(".pagination-neo-flex .pag-btn:first-child");
    const nextBtn = document.querySelector(".pagination-neo-flex .pag-btn:last-child");

    pagButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            pagButtons.forEach(b => b.classList.remove("active-droplet"));
            btn.classList.add("active-droplet");
            spawnToast("success", "Page Changed", `Loaded repository section page ${btn.textContent}`);
        });
    });

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            const activeIdx = Array.from(pagButtons).findIndex(b => b.classList.contains("active-droplet"));
            if (activeIdx > 0) {
                pagButtons.forEach(b => b.classList.remove("active-droplet"));
                pagButtons[activeIdx - 1].classList.add("active-droplet");
                spawnToast("success", "Page Changed", `Loaded repository section page ${activeIdx}`);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            const activeIdx = Array.from(pagButtons).findIndex(b => b.classList.contains("active-droplet"));
            if (activeIdx < pagButtons.length - 1) {
                pagButtons.forEach(b => b.classList.remove("active-droplet"));
                pagButtons[activeIdx + 1].classList.add("active-droplet");
                spawnToast("success", "Page Changed", `Loaded repository section page ${activeIdx + 2}`);
            }
        });
    }


    // ---------------------------------------------------------
    // 14. Toast Notification Spawner & Dismissals
    // ---------------------------------------------------------
    const toastStack = document.querySelector(".toast-stack-neo");

    document.querySelectorAll(".toast-neo").forEach(toast => {
        toast.style.cursor = "pointer";
        toast.addEventListener("click", () => dismissToast(toast));
    });

    function dismissToast(toast) {
        toast.style.transform = "translateX(120%) scale(0.9)";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }

    function spawnToast(type, title, message) {
        if (!toastStack) return;

        const toast = document.createElement("div");
        toast.className = `toast-neo ${type}`;
        toast.style.cursor = "pointer";
        toast.style.transform = "translateX(120%)";
        toast.style.transition = "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15)";
        
        toast.innerHTML = `
            <span class="toast-indicator"></span>
            <div class="toast-msg"><strong>${title}:</strong> ${message}</div>
        `;

        toast.addEventListener("click", () => dismissToast(toast));
        toastStack.appendChild(toast);

        setTimeout(() => {
            toast.style.transform = "translateX(0)";
        }, 50);

        setTimeout(() => {
            if (toast.parentNode) dismissToast(toast);
        }, 6000);
    }


    // ---------------------------------------------------------
    // 15. Table Header Clicking & Row Action Binding
    // ---------------------------------------------------------
    const tableHeaders = document.querySelectorAll(".table-neo th");

    if (tableHeaders.length && tableBody) {
        let sortDirection = false;

        tableHeaders.forEach((header, colIndex) => {
            if (colIndex === 3) return; // Action headers do not trigger sorting

            header.style.cursor = "pointer";
            header.addEventListener("click", () => {
                const rows = Array.from(tableBody.querySelectorAll("tr"));
                if (projects.length === 0) return;

                rows.sort((rowA, rowB) => {
                    const cellA = rowA.children[colIndex].textContent.trim();
                    const cellB = rowB.children[colIndex].textContent.trim();

                    if (!isNaN(Date.parse(cellA)) && !isNaN(Date.parse(cellB))) {
                        return sortDirection ? Date.parse(cellB) - Date.parse(cellA) : Date.parse(cellA) - Date.parse(cellB);
                    }
                    return sortDirection ? cellB.localeCompare(cellA) : cellA.localeCompare(cellB);
                });

                tableBody.innerHTML = "";
                rows.forEach(r => tableBody.appendChild(r));
                
                bindRowActionListeners();
                sortDirection = !sortDirection;

                spawnToast("success", "Table Sorted", `Sorted column ascending: ${header.textContent.split(" ")[0]}`);
            });
        });
    }

    function bindRowActionListeners() {
        // Dynamic Diagnostic Operations
        document.querySelectorAll(".row-action-btn").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const row = btn.closest("tr");
                const rowName = row.children[0].textContent;
                spawnToast("warning", "Diagnostics", `Core diagnostic executed for case study: "${rowName}"`);
            };
        });

        // Trigger heavy-tablet modal on delete
        document.querySelectorAll(".row-delete-btn").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const row = btn.closest("tr");
                const id = parseInt(row.getAttribute("data-id"));
                
                projectToDeleteId = id; // Store ID in queue
                
                // Adjust Modal texts to show specific case study deletion alert
                document.getElementById("modal-title-label").textContent = "DISMANTLE CASE STUDY?";
                document.getElementById("modal-body-desc").textContent = `This action permanently dissolves the creative case study project "${row.children[0].textContent}" from active repository logs. All compiled visual buffers will be archived.`;
                confirmBtn.textContent = "DISMANTLE";
                confirmBtn.className = "modal-btn-neo delete-danger";
                
                openModal();
            };
        });
    }


    // ---------------------------------------------------------
    // 16. Create & Sync New Project Signal Asset
    // ---------------------------------------------------------
    const createNewBtn = document.getElementById("create-new-empty-btn");

    if (createNewBtn && tableBody) {
        createNewBtn.addEventListener("click", () => {
            const projectNames = [
                "Hyperion Spatial Synths Pad",
                "Andromeda Displacement Map",
                "Nebula Exhaust Vapor Relays",
                "Outfit Skeuomorphic Grid Canvas"
            ];
            const randomName = projectNames[Math.floor(Math.random() * projectNames.length)];
            const randomId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;

            const newProject = {
                id: randomId,
                name: randomName,
                date: "2026",
                status: Math.random() > 0.4 ? "Active" : "Completed",
                category: Math.random() > 0.5 ? "audio" : "creative"
            };

            projects.push(newProject);
            saveProjects();
            renderProjects();
            updateGraph();

            spawnToast("success", "Asset Formed", "Successfully synchronized new creative case study.");
        });
    }


    // ---------------------------------------------------------
    // 17. Volumetric Canvas Smoke Particle System
    // ---------------------------------------------------------
    let isModalActive = false;

    class SmokeParticle {
        constructor(x, y, colorType = 'rose') {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() * 0.6 - 0.3);
            this.vy = -(Math.random() * 0.8 + 0.4);
            this.size = Math.random() * 5 + 4;
            this.maxSize = Math.random() * 20 + 20;
            this.alpha = Math.random() * 0.4 + 0.3;
            this.decay = Math.random() * 0.005 + 0.003;
            
            if (colorType === 'gold') {
                this.r = Math.floor(Math.random() * 20 + 230);
                this.g = Math.floor(Math.random() * 40 + 150);
                this.b = Math.floor(Math.random() * 30 + 100);
            } else if (colorType === 'rose') {
                this.r = 183;
                this.g = 110;
                this.b = 121;
            } else {
                this.r = 38;
                this.g = 43;
                this.b = 50;
            }
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.size < this.maxSize) {
                this.size += 0.2;
            }
            this.alpha -= this.decay;
        }

        draw(ctx) {
            ctx.beginPath();
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            grad.addColorStop(0, `rgba(${this.r}, ${this.g}, ${this.b}, ${this.alpha})`);
            grad.addColorStop(0.6, `rgba(${this.r - 20}, ${this.g - 20}, ${this.b - 20}, ${this.alpha * 0.4})`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = grad;
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // A. Switch Smoke System
    const switchCanvas = document.getElementById("switch-smoke-canvas");
    const smokeSwitch = document.getElementById("smoke-switch-trigger");

    if (switchCanvas && smokeSwitch) {
        const sCtx = switchCanvas.getContext("2d");
        const particles = [];
        let spawnInterval = null;

        function renderSwitchSmoke() {
            sCtx.clearRect(0, 0, switchCanvas.width, switchCanvas.height);

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update();
                p.draw(sCtx);

                if (p.alpha <= 0 || p.y < 0) {
                    particles.splice(i, 1);
                }
            }

            if (smokeSwitch.checked || particles.length > 0) {
                requestAnimationFrame(renderSwitchSmoke);
            }
        }

        smokeSwitch.addEventListener("change", () => {
            if (smokeSwitch.checked) {
                spawnToast("warning", "Voltage Connected", "Surreal smoke emitted from primary molten relays.");
                spawnInterval = setInterval(() => {
                    const spawnX = switchCanvas.width / 2 + 32;
                    const spawnY = switchCanvas.height / 2 + 10;
                    particles.push(new SmokeParticle(spawnX, spawnY, 'gold'));
                    particles.push(new SmokeParticle(spawnX + (Math.random() * 6 - 3), spawnY, 'rose'));
                }, 90);

                renderSwitchSmoke();
            } else {
                clearInterval(spawnInterval);
            }
        });
    }

    // B. Constant Active Step 3 Node Smoke
    if (stepCanvas) {
        const stCtx = stepCanvas.getContext("2d");
        const stepParticles = [];

        setInterval(() => {
            const spawnX = stepCanvas.width / 2;
            const spawnY = stepCanvas.height - 20;
            stepParticles.push(new SmokeParticle(spawnX, spawnY, 'gold'));
        }, 180);

        function renderStepSmoke() {
            stCtx.clearRect(0, 0, stepCanvas.width, stepCanvas.height);

            for (let i = stepParticles.length - 1; i >= 0; i--) {
                const p = stepParticles[i];
                p.update();
                p.draw(stCtx);

                if (p.alpha <= 0) {
                    stepParticles.splice(i, 1);
                }
            }
            requestAnimationFrame(renderStepSmoke);
        }
        renderStepSmoke();
    }

    // C. Volumetric Modal Smoke Canvas overlay
    const modalCanvas = document.getElementById("modal-smoke-canvas");
    if (modalCanvas) {
        const mCtx = modalCanvas.getContext("2d");
        const modalParticles = [];

        function resizeModalCanvas() {
            modalCanvas.width = window.innerWidth;
            modalCanvas.height = window.innerHeight;
        }
        resizeModalCanvas();
        window.addEventListener("resize", resizeModalCanvas);

        setInterval(() => {
            if (isModalActive) {
                const spawnX = Math.random() * modalCanvas.width;
                const spawnY = modalCanvas.height + 20;
                modalParticles.push(new SmokeParticle(spawnX, spawnY, 'slate'));
                
                if (Math.random() < 0.25) {
                    const tabletRect = document.getElementById("modal-tablet-container").getBoundingClientRect();
                    const sparkX = tabletRect.left + (Math.random() * tabletRect.width);
                    const sparkY = tabletRect.top + (Math.random() * tabletRect.height);
                    modalParticles.push(new SmokeParticle(sparkX, sparkY, 'gold'));
                }
            }
        }, 60);

        function renderModalSmoke() {
            if (!isModalActive && modalParticles.length === 0) return;
            
            mCtx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);

            for (let i = modalParticles.length - 1; i >= 0; i--) {
                const p = modalParticles[i];
                p.update();
                p.draw(mCtx);

                if (p.alpha <= 0) {
                    modalParticles.splice(i, 1);
                }
            }

            requestAnimationFrame(renderModalSmoke);
        }

        window.spawnModalSmoke = function() {
            renderModalSmoke();
        };
    }

    // Boot App State
    loadProjects();
});
