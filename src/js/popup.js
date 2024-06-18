(function(){
  // 定数
  const DEFAULT_NAME = 'name';
  const DEFAULT_COMMAND = 'Command';
  
  // 要素
  const addTab = document.createElement('div');
  addTab.id = 'js-add-tab-trigger';
  addTab.className = 'command-manager-tab-add';

  const fieldElement = (name = DEFAULT_NAME, command = DEFAULT_COMMAND) => `
    <label for="command-manager-name-input" class="command-manager-label label-name">
      <input type="text" class="command-manager-name-input js-name-input" value="${name}" readonly>
    </label>
    <label for="command-manager-command-input" class="command-manager-label label-command">
      <input type="text" class="command-manager-command-input js-command-input js-copy-trigger" value="${command}" readonly>
    </label>
    <div class="command-manager-button-wrap">
      <button class="command-manager-button button-edit js-edit-trigger">Edit</button>
      <button class="command-manager-button button-update js-update-trigger">Update</button>
      <button class="command-manager-button button-delete js-delete-trigger">Delete</button>
    </div>`;
  
  // DOM取得
  const tabWrap = document.getElementById('js-tab-wrap');
  const commandContainer = document.getElementById('js-command-container');
  let tabs = Array.from(document.getElementsByClassName('js-tab'));
  let commandBlocks = Array.from(document.getElementsByClassName('js-command-block'));
  let editTriggers = Array.from(document.getElementsByClassName('js-edit-trigger'));
  let deleteTriggers = Array.from(document.getElementsByClassName('js-delete-trigger'));
  let copyTriggers = Array.from(document.getElementsByClassName('js-copy-trigger'));

  // クラス付与・削除
  const addClass = (e, str) => {
    e.classList.add(str);
  }
  const removeClass = (e, str) => {
    e.classList.remove(str);
  }

  // 設定を読み込む
  const loadSettings = () => {
    return new Promise((resolve) => {
      chrome.storage.local.get('tabs', (result) => {
        const tabList = result.tabs || [];
        tabList.forEach(tab => {
          const newTab = createTab(tab.index);
          const newBlock = document.createElement('div');
          newBlock.className = 'command-manager-block js-command-block';
          newBlock.setAttribute('data-block-index', tab.index);
    
          tab.fields.forEach(field => {
            const newField = createField(field.name, field.command);
            newBlock.appendChild(newField);
          });

          if(tab.index === 1) {
            newBlock.classList.add('is-active');
            newTab.classList.add('is-active');
          }

          commandContainer.appendChild(newBlock);
          tabWrap.appendChild(newTab);
        });
        tabWrap.appendChild(addTab);

        resolve();
      });
    });
  };

  // タブを生成する
  const createTab = (index) => {
    const newTab = document.createElement('div');
    newTab.className = 'command-manager-tab js-tab';
    newTab.setAttribute('data-tab-index', index);
    newTab.textContent = `Tab ${index}`;
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'command-manager-tab-delete js-tab-delete';

    newTab.appendChild(deleteIcon);
  
    return newTab;
  };

  // フィールドを生成する
  const createField = (name = DEFAULT_NAME, command = DEFAULT_COMMAND) => {
    const newField = document.createElement('div');
    newField.className = 'command-manager-field';
    newField.innerHTML = fieldElement(name, command);

    return newField;
  };
  
  // フィールドの状態をリセットする
  const resetFields = () => {
    const updateButtons = document.querySelectorAll('.js-update-trigger.is-active');
    const editTriggers = document.querySelectorAll('.js-edit-trigger.is-hidden');
    const inputs = document.querySelectorAll('.command-manager-field input');
  
    updateButtons.forEach(button => {
      removeClass(button, 'is-active');
    });
  
    editTriggers.forEach(trigger => {
      removeClass(trigger, 'is-hidden');
    });
  
    inputs.forEach(input => {
      input.setAttribute('readonly', true);
    });
  };

  // タブを追加する
  const onClickAddTab = () => {
    const trigger = document.getElementById('js-add-tab-trigger');
    const tabContainer = document.getElementById('js-tab-wrap');
    const commandContainer = document.getElementById('js-command-container');
  
    trigger.addEventListener('click', () => {
      tabs = Array.from(document.getElementsByClassName('js-tab'));
      commandBlocks = Array.from(document.getElementsByClassName('js-command-block'));

      const newTabCount = tabs.length + 1;
      const newTab = createTab(newTabCount);
      const newCommandBlock = document.createElement('div');
      newCommandBlock.className = 'command-manager-block js-command-block';
      newCommandBlock.setAttribute('data-block-index', newTabCount);
      const newField = createField();

      tabContainer.insertBefore(newTab, trigger);
      newCommandBlock.appendChild(newField);
      commandContainer.appendChild(newCommandBlock);

      chrome.storage.local.get({ tabs: [] }, (result) => {
        const tabList = result.tabs;
        const newTabData = {
          index: newTabCount,
          fields: [{
            name: DEFAULT_NAME,
            command: DEFAULT_COMMAND,
          }]
        };
        
        tabList.push(newTabData); 
  
        chrome.storage.local.set({ tabs: tabList }, () => {});
      });
  
      newTab.addEventListener('click', () => {
        resetFields();
  
        tabs.forEach(tab => {
          tab.classList.remove('is-active');
        });
        commandBlocks.forEach(block => {
          block.classList.remove('is-active');
        });
  
        newCommandBlock.classList.add('is-active');
        newTab.classList.add('is-active');
      });
  
      newTab.click();
      onSwitchTab();
      onClickDeleteTab();
      onClickEditCommand();
      onClickDeleteCommand();
      onClickCopyCommand();
    });
  };

  // Editボタンをクリックしたときの処理
  const onClickEditCommand = () => {
    editTriggers = Array.from(document.getElementsByClassName('js-edit-trigger'));
  
    editTriggers.forEach((trigger) => {
      if (!trigger.dataset.listenerAttached) {
        trigger.dataset.listenerAttached = true;
        trigger.addEventListener('click', function() {
          resetFields();
    
          const parentField = trigger.closest('.command-manager-field');
          const inputs = parentField.querySelectorAll('input');
          const updateButton = parentField.querySelector('.js-update-trigger');
          const activeBlock = document.querySelector('.js-command-block.is-active');
          const activeBlockKey = Number(activeBlock.getAttribute('data-block-index'));
          const activeEditTriggers = Array.from(activeBlock.querySelectorAll('.js-edit-trigger'));
          const index = activeEditTriggers.indexOf(trigger);
    
          addClass(trigger, 'is-hidden');
          addClass(updateButton, 'is-active');
    
          inputs.forEach(input => {
            input.removeAttribute('readonly');
            input.focus();
          });
    
          const newUpdateButton = updateButton.cloneNode(true);
          updateButton.parentNode.replaceChild(newUpdateButton, updateButton);
    
          newUpdateButton.addEventListener('click', function () {
            onClickUpdate(newUpdateButton, inputs, trigger, activeBlockKey, index);
          }, { once: true });
        });
      }
    });
  };

  // Updateボタンをクリックしたときの処理
  const onClickUpdate = (updateButton, inputs, trigger, activeBlockKey, index) => {
    let tabs;
  
    chrome.storage.local.get({ tabs: [] }, (result) => {
      tabs = result.tabs;

      const activeBlockData = tabs.find(tab => tab.index === activeBlockKey);
      const fieldData = activeBlockData.fields[index];
  
      inputs.forEach(input => {
        const originalValue = input.value;
        const trimmedValue = originalValue.trim();
  
        input.value = trimmedValue;
  
        if (input.classList.contains('js-name-input')) {
          fieldData.label = trimmedValue; // ラベルデータを更新
        } else {
          fieldData.command = trimmedValue; // コマンドデータを更新
        }
  
        input.setAttribute('readonly', true);
      });
  
      chrome.storage.local.set({ tabs: tabs }, () => {});
  
      removeClass(updateButton, 'is-active');
      removeClass(trigger, 'is-hidden');
    });
  };

  // Deleteボタンをクリックしたときの処理
  const onClickDeleteCommand = () => {
    deleteTriggers = Array.from(document.getElementsByClassName('js-delete-trigger'));

    deleteTriggers.forEach((trigger) => {
      if (!trigger.dataset.listenerAttached) {
        trigger.dataset.listenerAttached = true;

        trigger.addEventListener('click', function () {
          const parentField = trigger.closest('.command-manager-field');
          const activeBlock = document.querySelector('.js-command-block.is-active');
          const activeBlockKey = Number(activeBlock.getAttribute('data-block-index'));
          const fields = activeBlock.querySelectorAll('.command-manager-field');

          if (fields.length <= 1) {
            alert('これ以上削除できません！');
            return;
          }

          const fieldIndex = Array.from(fields).indexOf(parentField);

          parentField.remove();

          chrome.storage.local.get({ tabs: [] }, (result) => {
            const tabs = result.tabs;
            const activeBlockData = tabs.find(tab => tab.index === activeBlockKey);
            console.log(activeBlockData, fieldIndex, activeBlockData && fieldIndex > -1)
    
            if (activeBlockData && fieldIndex > -1) {
              activeBlockData.fields.splice(fieldIndex, 1);

              chrome.storage.local.set({ tabs: tabs }, () => {
                console.log(`フィールドがストレージから削除されました。タブキー: ${activeBlockKey}, インデックス: ${fieldIndex}`);
              });
            }
          });
        });
      }
    });
  };

  // コマンドをコピーするための処理
  const onClickCopyCommand = () => {
    copyTriggers = Array.from(document.getElementsByClassName('js-copy-trigger'));

    copyTriggers.forEach((trigger) => {
      trigger.addEventListener('click', async function() {
        const commandLabel = trigger.closest('.command-manager-label');
        const commandText = trigger.value;

        try {
          if (commandText.length > 0) {
            await navigator.clipboard.writeText(commandText);

            commandLabel.classList.add('is-copied');
            setTimeout(() => {
              commandLabel.classList.remove('is-copied');
            }, 1500);
          }
        } catch (err) {
          console.error(`Copy is failed: ${err}`);
        }
      });
    });
  };
  
  // コマンドを追加するための処理
  const onClickAddCommand = () => {
    const trigger = document.getElementById('js-add-command-trigger');
  
    trigger.addEventListener('click', () => {
      const newField = document.createElement('div');
      newField.className = 'command-manager-field';
      newField.innerHTML = fieldElement();
  
      let activeBlock;

      commandBlocks.forEach(block => {
        if (block.classList.contains('is-active')) {
          block.appendChild(newField);
          activeBlock = block;
        }
      });
  
      const activeBlockKey = Number(activeBlock.getAttribute('data-block-index'));
      const fieldCount = activeBlock.getElementsByClassName('command-manager-field').length - 1;
      const newInputs = newField.querySelectorAll('input');

      newInputs.forEach(input => {
        const keyBase = input.classList.contains('js-name-input') ? 'label' : 'command';
        const storageKey = keyBase + fieldCount;

        input.setAttribute('data-storage-key', storageKey);
      });
  
      chrome.storage.local.get({ tabs: [] }, (result) => {
        const tabs = result.tabs;
        const activeBlockData = tabs.find(tab => tab.index === activeBlockKey) || { index: activeBlockKey, fields: [] };
  
        activeBlockData.fields.push({ label: DEFAULT_NAME, command: DEFAULT_COMMAND });
  
        if (!tabs.some(tab => tab.index === activeBlockKey)) {
          tabs.push(activeBlockData);
        }
  
        chrome.storage.local.set({ tabs: tabs }, () => {});
      });
  
      onClickEditCommand();
      onClickDeleteCommand(); 
      onClickCopyCommand();
    });
  };

  // タブの切り替え
  const onSwitchTab = () => {
    tabs = Array.from(document.getElementsByClassName('js-tab'));
    commandBlocks = Array.from(document.getElementsByClassName('js-command-block'));

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        resetFields();

        const clickedTabIndex = tab.getAttribute('data-tab-index');
        const target = document.querySelector(`.js-command-block[data-block-index="${clickedTabIndex}"]`);

        tabs.forEach(tab => {
          tab.classList.remove('is-active');
        });
        commandBlocks.forEach(block => {
          block.classList.remove('is-active');
        });
  
        console.log(clickedTabIndex, target)
        tab.classList.add('is-active');
        target.classList.add('is-active');
      });
    });
  };

  // タブ削除確認アラートを表示するための関数
  const showDeleteConfirmation = (tabIndex, tabElement, blockElement) => {
    const alertContainer = document.getElementById('js-alert-container');
    alertContainer.innerHTML = `
      <div class="alert-content">
        <p>Are you sure you want to remove?</p>
        <div class="alert-button-wrap">
          <button id="js-alert-cancel" class="alert-button button-cancel">Cancel</button>
          <button id="js-alert-confirm" class="alert-button button-confirm js-alert-confirm">Remove</button>
        </div>
      </div>
    `;
    alertContainer.classList.add('is-show');
  
    const cancelButton = alertContainer.querySelector('#js-alert-cancel');
    const confirmButton = alertContainer.querySelector('#js-alert-confirm');
  
    confirmButton.addEventListener('click', () => {
      if (tabs.length <= 1) {
        alert('これ以上削除できません！');
        alertContainer.classList.remove('is-show');
        alertContainer.innerHTML = '';
        return;
      }
  
      tabElement.remove();
      blockElement.remove();
  
      chrome.storage.local.get({ tabs: [] }, (result) => {
        const tabsData = result.tabs.filter(tab => tab.index !== tabIndex);
        chrome.storage.local.set({ tabs: tabsData }, () => {
          tabs = Array.from(document.getElementsByClassName('js-tab'));
          commandBlocks = Array.from(document.getElementsByClassName('js-command-block'));
  
          if (tabs.length > 0) {
            tabs[0].classList.add('is-active');
            commandBlocks[0].classList.add('is-active');
          }
        });
      });
  
      alertContainer.classList.remove('is-show');
      alertContainer.innerHTML = '';
    });
  
    cancelButton.addEventListener('click', () => {
      alertContainer.classList.remove('is-show');
      alertContainer.innerHTML = '';
    });
  };

  // タブ削除ボタンをクリックしたときの処理
  const onClickDeleteTab = () => {
    const deleteTriggers = Array.from(document.getElementsByClassName('js-tab-delete'));
  
    deleteTriggers.forEach(trigger => {
      trigger.addEventListener('click', function () {
        const tabElement = trigger.closest('.js-tab');
        const tabIndex = Number(tabElement.getAttribute('data-tab-index'));
        const blockElement = document.querySelector(`.js-command-block[data-block-index="${tabIndex}"]`);
  
        showDeleteConfirmation(tabIndex, tabElement, blockElement);
      });
    });
  };

  const organizeStorage = () => {
    chrome.storage.local.get('tabs', (result) => {
      let tabList = result.tabs || [];
  
      // データの整理
      tabList = tabList.map((tabData, index) => {
        return {
          ...tabData,
          index: index + 1,          // indexを数値に変更
          fields: tabData.fields.map(field => {
            return {
              command: field.command,
              name: field.label        // labelをnameに変更
            };
          })
        };
      });
  
      // 更新されたデータをストレージに保存
      chrome.storage.local.set({ tabs: tabList }, () => {
        console.log('ストレージが整理されました');
        console.log(JSON.stringify(tabList, null, 2));  // 整理後のデータを確認用にコンソールに出力
      });
    });
  };
  
  window.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    onSwitchTab();
    onClickAddTab();
    onClickDeleteTab();
    onClickAddCommand();
    onClickEditCommand();
    onClickDeleteCommand();
    onClickCopyCommand();
    // organizeStorage();
  });
}())