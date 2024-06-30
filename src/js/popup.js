(function(){
  // 定数
  const DEFAULT_NAME = 'name';
  const DEFAULT_COMMAND = 'Command';
  const MAX_NAME_LENGTH = 30;
  
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
          const newTab = createTab(tab.index, tab.name);
          const newBlock = document.createElement('div');
          newBlock.className = 'command-manager-block js-command-block';
          newBlock.setAttribute('data-block-index', tab.index);
    
          tab.fields.forEach(field => {
            const newField = createField(field.name, field.command);
            newBlock.appendChild(newField);
          });
  
          if (tab.index === 1) {
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
  const createTab = (index, name = `Tab ${index}`) => {
    const newTab = document.createElement('div');
    newTab.className = 'command-manager-tab js-tab';
    newTab.setAttribute('data-tab-index', index);
  
    const tabInput = document.createElement('input');
    tabInput.type = 'text';
    tabInput.className = 'command-manager-tab-input js-tab-input';
    tabInput.value = name;
    tabInput.setAttribute('readonly', true);
  
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'command-manager-tab-delete js-tab-delete';
  
    newTab.appendChild(tabInput);
    newTab.appendChild(deleteIcon);
  
    return newTab;
  };

  // フィールドを生成する
  const createField = (name = DEFAULT_NAME, command = DEFAULT_COMMAND) => {
    const truncatedName = name.length > MAX_NAME_LENGTH ? name.slice(0, MAX_NAME_LENGTH) + '...' : name;
  
    const newField = document.createElement('div');
    newField.className = 'command-manager-field';
    newField.innerHTML = fieldElement(truncatedName, command);
    newField.querySelector('.js-name-input').setAttribute('data-full-text', name); // フルネームを設定
  
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
          name: newTab.querySelector('.js-tab-input').value,
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
      onClickEditTab();
      onClickEdit();
      onClickDeleteCommand();
      onClickCopyCommand();
    });
  };

  // Editボタンをクリックしたときの処理
  const onClickEdit = () => {
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
          const originalName = inputs[0].value;
          const originalCommand = inputs[1].value;
  
          addClass(trigger, 'is-hidden');
          addClass(updateButton, 'is-active');
  
          inputs.forEach(input => {
            input.removeAttribute('readonly');
            if(input.classList.contains('js-name-input')) {
              const originalText = input.getAttribute('data-full-text') || input.value;
              input.value = originalText;
            }
            input.focus();
          });
  
          const newUpdateButton = updateButton.cloneNode(true);
          updateButton.parentNode.replaceChild(newUpdateButton, updateButton);
  
          newUpdateButton.addEventListener('click', function () {
            onClickUpdate(newUpdateButton, originalName, originalCommand, inputs, trigger, activeBlockKey, index);
          }, { once: true });
        });
      }
    });
  };

  // Updateボタンをクリックしたときの処理
  const onClickUpdate = (updateButton, originalName, originalCommand, inputs, trigger, activeBlockKey, index) => {
    let tabs;
  
    chrome.storage.local.get({ tabs: [] }, (result) => {
      tabs = result.tabs;
  
      const activeBlockData = tabs.find(tab => tab.index === activeBlockKey);
      const fieldData = activeBlockData.fields[index];
  
      inputs.forEach((input, index) => {
        const originalValue = input.value;
        const trimmedValue = originalValue.trim();

        if (trimmedValue.length === 0) {
          alert("Please enter at least one character.");
          index === 0 ? input.value = originalName : input.value = originalCommand;
          input.setAttribute('readonly', true);
          return;
        }
  
        input.value = trimmedValue;
  
        if (input.classList.contains('js-name-input')) {
          fieldData.name = trimmedValue;
  
          if (trimmedValue.length > MAX_NAME_LENGTH) {
            input.setAttribute('data-full-text', trimmedValue);
            input.value = trimmedValue.slice(0, MAX_NAME_LENGTH) + '...';
          } else {
            input.removeAttribute('data-full-text');
          }
        } else if (input.classList.contains('js-command-input')) {
          fieldData.command = trimmedValue;
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
            alert("You can't delete any more!");
            return;
          }

          const fieldIndex = Array.from(fields).indexOf(parentField);

          parentField.remove();

          chrome.storage.local.get({ tabs: [] }, (result) => {
            const tabs = result.tabs;
            const activeBlockData = tabs.find(tab => tab.index === activeBlockKey);
    
            if (activeBlockData && fieldIndex > -1) {
              activeBlockData.fields.splice(fieldIndex, 1);

              chrome.storage.local.set({ tabs: tabs }, () => {});
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
        if(trigger.readOnly === true) {
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
  
      onClickEdit();
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
  
        tab.classList.add('is-active');
        target.classList.add('is-active');
      });
    });
  };

  // テキストの幅を取得する
  const getTextWidth = (text) => {
    let width = 0;
    for (let char of text) {
      if (char.match(/[ -~]/)) {
        width += .55;
      } else {
        width += 1;
      }
    }
    return width;
  };

  // タブ名の編集を有効にする
  const onClickEditTab = () => {
    const tabInputs = document.querySelectorAll('.js-tab-input');
    let originalName;
  
    tabInputs.forEach(tabInput => {
      if (!tabInput.dataset.listenerAttached) {
        tabInput.dataset.listenerAttached = 'true';

        const resizeInput = () => {
          const textWidth = getTextWidth(tabInput.value);
          tabInput.style.width = `${textWidth + .5}em`;
        };
        
        resizeInput();

        tabInput.addEventListener('dblclick', () => {
          originalName = tabInput.value.trim();
          tabInput.removeAttribute('readonly');
          tabInput.focus();

          const updateInputWidth = (input) => {
            const textWidth = getTextWidth(input.value);
            input.style.width = `${textWidth + .5}em`;
          }
          tabInput.addEventListener('input', () => {
            updateInputWidth(tabInput);
          });

          const saveTabName = () => {
            const newName = tabInput.value.trim();
            
            if (newName.length === 0) {
              alert("Please enter at least one character.");
              tabInput.value = originalName;
              tabInput.setAttribute('readonly', true);
              return;
            }
  
            resizeInput();
            tabInput.setAttribute('readonly', true);
                
            const tabElement = tabInput.closest('.js-tab');
            const tabIndex = Number(tabElement.getAttribute('data-tab-index'));
            chrome.storage.local.get({ tabs: [] }, (result) => {
              const tabs = result.tabs || [];
              const tabData = tabs.find(tab => tab.index === tabIndex);
              if (tabData) {
                tabData.name = newName;
                chrome.storage.local.set({ tabs: tabs }, () => {});
              }
            });
          };
  
          tabInput.addEventListener('blur', saveTabName);
          tabInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              tabInput.blur();
            }
          });
        });
      }
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
        alert("You can't delete any more!");
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
  
  window.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    onSwitchTab();
    onClickAddTab();
    onClickEditTab();
    onClickDeleteTab();
    onClickAddCommand();
    onClickEdit();
    onClickDeleteCommand();
    onClickCopyCommand();
  });
}())