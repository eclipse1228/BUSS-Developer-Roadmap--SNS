        function drawRoadmap(data) {
            const canvas = document.getElementById('roadmapCanvas');
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Define node sizes
            const nodeSize = { width: 150, height: 50 };
            const itemSize = { width: 200, height: 30 };

            // Define initial positions
            const startX = 50;
            const startY = 50;
            const xOffset = 300;
            const yOffset = 100;
            const itemXOffset = 250;

            // Draw nodes
            const categoryNodes = {};
            let currentY = startY;

            for (const [category, categoryData] of Object.entries(data.frontEnd)) {
                const categoryX = startX;
                const categoryY = currentY;
                const categoryNode = drawNode(ctx, categoryX, categoryY, category.toUpperCase(), nodeSize);
                categoryNodes[category] = { ...categoryNode, items: [] };

                let itemY = categoryY + nodeSize.height + 20;
                for (const [item, itemData] of Object.entries(categoryData)) {
                    const itemNode = drawNode(ctx, categoryX + itemXOffset, itemY, item, itemSize);
                    categoryNodes[category].items.push({ ...itemNode, data: itemData });
                    drawConnection(ctx, categoryX + nodeSize.width, categoryY + nodeSize.height / 2, itemNode.x, itemNode.y + itemSize.height / 2);
                    itemY += itemSize.height + 20;
                }

                currentY += Math.max(itemY - categoryY, nodeSize.height + yOffset);
            }

            // Draw connections between categories
            const categoryOrder = Object.keys(data.frontEnd);
            for (let i = 0; i < categoryOrder.length - 1; i++) {
                const currentCategory = categoryOrder[i];
                const nextCategory = categoryOrder[i + 1];
                const currentNode = categoryNodes[currentCategory];
                const nextNode = categoryNodes[nextCategory];
                drawVerticalConnection(ctx, currentNode.x + nodeSize.width / 2, currentNode.y + nodeSize.height, nextNode.y + nodeSize.height / 22);
            }

            // Add click event listeners for nodes
            canvas.addEventListener('click', (event) => {
                const x = event.offsetX;
                const y = event.offsetY;
                for (const category in categoryNodes) {
                    const categoryNode = categoryNodes[category];
                    if (isInsideNode(x, y, categoryNode)) {
                        openModal(categoryNode);
                        return;
                    }
                    for (const itemNode of categoryNode.items) {
                        if (isInsideNode(x, y, itemNode)) {
                            openModal(itemNode);
                            return;
                        }
                    }
                }
            });
        }

        function drawNode(ctx, x, y, label, size) {
            ctx.fillStyle = 'yellow';
            ctx.fillRect(x, y, size.width, size.height);
            ctx.strokeStyle = 'black';
            ctx.strokeRect(x, y, size.width, size.height);
            ctx.fillStyle = 'black';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x + size.width / 2, y + size.height / 2);
            return { x, y, width: size.width, height: size.height };
        }

        function drawConnection(ctx, x1, y1, x2, y2) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        function drawVerticalConnection(ctx, x, y1, y2) {
            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
            ctx.stroke();
        }

        function isInsideNode(x, y, node) {
            return x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height;
        }

        function openModal(node) {
            const modal = document.getElementById('courseModal');
            const courseDescription = document.getElementById('courseDescription');
            const courseLink = document.getElementById('courseLink');

            courseDescription.textContent = node.data.description;
            courseLink.href = `https://${node.data.course}`;
            modal.style.display = 'block';
        }

        function closeModal() {
            const modal = document.getElementById('courseModal');
            modal.style.display = 'none';
        }

        // Close modal when the user clicks on <span> (x)
        document.getElementsByClassName('close')[0].onclick = function() {
            closeModal();
        }

        // Close modal when the user clicks anywhere outside of the modal
        window.onclick = function(event) {
            const modal = document.getElementById('courseModal');
            if (event.target == modal) {
                closeModal();
            }
        }

        fetch('../static/frontend.json')
            .then(response => response.json())
            .then(data => {
                drawRoadmap(data);
            })
            .catch(error => {
                console.error('Error:', error);
            });

        window.addEventListener('resize', () => {
            fetch('/static/frontend.json')
                .then(response => response.json())
                .then(data => {
                    drawRoadmap(data);
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        });