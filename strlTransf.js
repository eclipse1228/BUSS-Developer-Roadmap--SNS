const fs = require('fs');

// 외부 JSON 파일 읽기
fs.readFile('backend.json', 'utf8', (err, data) => {
  if (err) {
    console.error('파일을 읽는 중 오류가 발생했습니다:', err);
    return;
  }
  try {
    // JSON 파싱
    const jsonData = JSON.parse(data);
    const d3TreeData = convertToD3Tree(jsonData);
    console.log(d3TreeData);
    saveToJsonFile(d3TreeData, 'output.json');
  } catch (err) {
    console.error('JSON 파일 파싱 중 오류가 발생했습니다:', err);
  }
});

function convertToD3Tree(data) {
  var treeData = {
    "name": data.backend.title,
    "description": data.backend.description,
    "children": []
  };

  data.backend.stages.forEach(function(stage) {
    var stageNode = {
      "name": stage.title,
      "children": []
    };

    stage.topics.forEach(function(topic) {
      var topicNode = {
        "name": topic.name,
        "description": topic.description,
        "children": []
      };

      topic.resources.forEach(function(resource) {
        topicNode.children.push({
          "name": resource.title,
          "description": resource.type,
          "url": resource.url
        });
      });

      stageNode.children.push(topicNode);
    });

    treeData.children.push(stageNode);
  });

  return treeData;
}

// 변환된 데이터를 JSON 파일에 저장
function saveToJsonFile(data, filename) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log("변환된 데이터가", filename, "파일에 저장되었습니다.");
}
