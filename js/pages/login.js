// ===== 登录/注册页面 =====
// 全屏认证页面，未登录时显示
// 暴露全局 LoginPage 对象

const LoginPage = {
    mode: 'login',   // 'login' | 'register'
    loading: false,
    error: '',
    _message: '',    // 初始提示消息（如"登录已过期"）

    /**
     * 渲染到指定容器
     * @param {HTMLElement} container - 主内容区
     * @param {string} message - 可选的提示消息
     */
    render(container, message = '') {
        this._message = message;
        container.innerHTML = this._buildHTML();
        this.bindEvents();
    },

    _buildHTML() {
        const isLogin = this.mode === 'login';
        const errorHtml = this.error
            ? `<div class="auth-error">${this._escapeHTML(this.error)}</div>`
            : '';
        const messageHtml = this._message && !this.error
            ? `<div class="auth-info">${this._escapeHTML(this._message)}</div>`
            : '';

        if (isLogin) {
            return `
                <div class="auth-page">
                    <div class="auth-shell">
                        <div class="auth-brand">
                            <div class="auth-mascot-wrap">
                                <img src="assets/mascot.png" alt="看板娘" class="auth-mascot">
                            </div>
                            <h1 class="auth-title">爆杯雷霆</h1>
                            <p class="auth-subtitle">校园饮品管理，记录每一杯的精彩</p>
                        </div>
                        <div class="auth-card">
                            ${messageHtml}
                            ${errorHtml}
                            <form class="auth-form" id="loginForm" autocomplete="off">
                                <div class="form-group">
                                    <label for="loginStudentId">学号</label>
                                    <input type="text" id="loginStudentId" class="form-input"
                                        placeholder="请输入学号" autocomplete="username"
                                        maxlength="50" enterkeyhint="next">
                                </div>
                                <div class="form-group">
                                    <label for="loginPassword">密码</label>
                                    <div class="auth-password-wrap">
                                        <input type="password" id="loginPassword" class="form-input"
                                            placeholder="请输入密码" autocomplete="current-password"
                                            maxlength="72" enterkeyhint="done">
                                        <button type="button" class="auth-password-toggle" id="loginPwdToggle" tabindex="-1">
                                            <i class="far fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block auth-submit" id="loginSubmitBtn" disabled>
                                    <span class="auth-submit-text">登 录</span>
                                    <span class="auth-submit-spinner" style="display:none;">
                                        <i class="fas fa-spinner fa-spin"></i>
                                    </span>
                                </button>
                            </form>
                            <div class="auth-switch">
                                还没有账号？<a href="#" id="goRegister">立即注册</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // 注册表单
        return `
            <div class="auth-page">
                <div class="auth-shell">
                    <div class="auth-brand">
                        <div class="auth-mascot-wrap">
                            <img src="assets/mascot.png" alt="看板娘" class="auth-mascot">
                        </div>
                        <h1 class="auth-title">加入爆杯雷霆</h1>
                        <p class="auth-subtitle">开始记录你的饮品之旅</p>
                    </div>
                    <div class="auth-card">
                        ${errorHtml}
                        <form class="auth-form" id="registerForm" autocomplete="off">
                            <div class="form-group">
                                <label for="regName">姓名 <span class="auth-required">*</span></label>
                                <input type="text" id="regName" class="form-input"
                                    placeholder="请输入真实姓名" autocomplete="name"
                                    maxlength="30" enterkeyhint="next">
                            </div>
                            <div class="form-group">
                                <label for="regStudentId">学号 <span class="auth-required">*</span></label>
                                <input type="text" id="regStudentId" class="form-input"
                                    placeholder="请输入学号（用于登录）" autocomplete="username"
                                    maxlength="50" enterkeyhint="next">
                            </div>
                            <div class="form-group">
                                <label for="regClassName">班级</label>
                                <input type="text" id="regClassName" class="form-input"
                                    placeholder="如：高三(1)班（选填）"
                                    maxlength="30" enterkeyhint="next">
                            </div>
                            <div class="form-group">
                                <label for="regPassword">密码 <span class="auth-required">*</span></label>
                                <div class="auth-password-wrap">
                                    <input type="password" id="regPassword" class="form-input"
                                        placeholder="6-72位密码" autocomplete="new-password"
                                        maxlength="72" enterkeyhint="next">
                                    <button type="button" class="auth-password-toggle" id="regPwdToggle" tabindex="-1">
                                        <i class="far fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="regConfirmPassword">确认密码 <span class="auth-required">*</span></label>
                                <input type="password" id="regConfirmPassword" class="form-input"
                                    placeholder="请再次输入密码" autocomplete="new-password"
                                    maxlength="72" enterkeyhint="done">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block auth-submit" id="registerSubmitBtn" disabled>
                                <span class="auth-submit-text">注 册</span>
                                <span class="auth-submit-spinner" style="display:none;">
                                    <i class="fas fa-spinner fa-spin"></i>
                                </span>
                            </button>
                        </form>
                        <div class="auth-switch">
                            已有账号？<a href="#" id="goLogin">返回登录</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        if (this.mode === 'login') {
            this._bindLoginEvents();
        } else {
            this._bindRegisterEvents();
        }
    },

    _bindLoginEvents() {
        const form = document.getElementById('loginForm');
        const studentIdEl = document.getElementById('loginStudentId');
        const passwordEl = document.getElementById('loginPassword');
        const submitBtn = document.getElementById('loginSubmitBtn');
        const toggleBtn = document.getElementById('loginPwdToggle');
        const goRegister = document.getElementById('goRegister');

        // 密码可见性切换
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this._togglePassword(passwordEl, toggleBtn);
            });
        }

        // 输入校验 → 启用/禁用按钮
        const validate = () => {
            const sid = (studentIdEl ? studentIdEl.value : '').trim();
            const pwd = passwordEl ? passwordEl.value : '';
            if (submitBtn) {
                submitBtn.disabled = !sid || !pwd || this.loading;
            }
        };

        if (studentIdEl) studentIdEl.addEventListener('input', validate);
        if (passwordEl) passwordEl.addEventListener('input', validate);

        // Enter 提交
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!this.loading) this._handleLogin();
            });
        }

        // 切换注册
        if (goRegister) {
            goRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchMode('register');
            });
        }

        // 初始禁用（防止浏览器自动填充绕过校验）
        validate();

        // 自动填充检测：延迟再检查一次
        setTimeout(validate, 300);
    },

    _bindRegisterEvents() {
        const form = document.getElementById('registerForm');
        const nameEl = document.getElementById('regName');
        const studentIdEl = document.getElementById('regStudentId');
        const passwordEl = document.getElementById('regPassword');
        const confirmEl = document.getElementById('regConfirmPassword');
        const submitBtn = document.getElementById('registerSubmitBtn');
        const toggleBtn = document.getElementById('regPwdToggle');
        const goLogin = document.getElementById('goLogin');

        // 密码可见性切换
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this._togglePassword(passwordEl, toggleBtn);
            });
        }

        const validate = () => {
            const name = (nameEl ? nameEl.value : '').trim();
            const sid = (studentIdEl ? studentIdEl.value : '').trim();
            const pwd = passwordEl ? passwordEl.value : '';
            const confirm = confirmEl ? confirmEl.value : '';
            const valid = name && sid && pwd && confirm && !this.loading;
            if (submitBtn) submitBtn.disabled = !valid;
        };

        if (nameEl) nameEl.addEventListener('input', validate);
        if (studentIdEl) studentIdEl.addEventListener('input', validate);
        if (passwordEl) passwordEl.addEventListener('input', validate);
        if (confirmEl) confirmEl.addEventListener('input', validate);

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!this.loading) this._handleRegister();
            });
        }

        if (goLogin) {
            goLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchMode('login');
            });
        }

        validate();
        setTimeout(validate, 300);
    },

    _togglePassword(inputEl, toggleBtn) {
        if (!inputEl) return;
        const isVisible = inputEl.type === 'text';
        inputEl.type = isVisible ? 'password' : 'text';
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = isVisible ? 'far fa-eye' : 'far fa-eye-slash';
            }
        }
    },

    async _handleLogin() {
        const studentIdEl = document.getElementById('loginStudentId');
        const passwordEl = document.getElementById('loginPassword');
        const studentId = (studentIdEl ? studentIdEl.value : '').trim();
        const password = passwordEl ? passwordEl.value : '';

        // 前端校验
        if (!studentId) {
            this._showError('请输入学号');
            return;
        }
        if (!password) {
            this._showError('请输入密码');
            return;
        }

        this.loading = true;
        this.error = '';
        this._clearError();
        this._setLoading(true);

        try {
            await App.loginWithPassword(studentId, password);
            // 登录成功 → 进入应用
            await App.completeAuthenticatedStartup();
        } catch (err) {
            if (err.isTimeout) {
                this._showError('请求超时，请检查网络或服务器');
            } else if (err.isNetworkError || err.code === 0) {
                this._showError('无法连接服务器，请检查后端或网络');
            } else if (err.code === 401) {
                this._showError('学号或密码错误');
            } else if (err.code === 400) {
                this._showError(err.message || '输入有误，请检查');
            } else {
                this._showError(err.message || '登录失败，请稍后重试');
            }
            // 登录失败：保留学号，清空密码
            if (passwordEl) passwordEl.value = '';
        } finally {
            this.loading = false;
            this._setLoading(false);
        }
    },

    async _handleRegister() {
        const nameEl = document.getElementById('regName');
        const studentIdEl = document.getElementById('regStudentId');
        const classEl = document.getElementById('regClassName');
        const passwordEl = document.getElementById('regPassword');
        const confirmEl = document.getElementById('regConfirmPassword');

        const name = (nameEl ? nameEl.value : '').trim();
        const studentId = (studentIdEl ? studentIdEl.value : '').trim();
        const className = (classEl ? classEl.value : '').trim();
        const password = passwordEl ? passwordEl.value : '';
        const confirm = confirmEl ? confirmEl.value : '';

        // 前端校验
        if (!name) { this._showError('请输入姓名'); return; }
        if (!studentId) { this._showError('请输入学号'); return; }
        if (!password) { this._showError('请输入密码'); return; }
        if (password.length < 6) { this._showError('密码至少6位'); return; }
        if (password.length > 72) { this._showError('密码最多72位'); return; }
        if (password !== confirm) { this._showError('两次密码不一致'); return; }

        this.loading = true;
        this.error = '';
        this._clearError();
        this._setLoading(true);

        try {
            await App.registerAccount({
                name,
                className: className || '未知班级',
                studentId,
                password,
            });
            // 注册成功 → 进入应用
            await App.completeAuthenticatedStartup();
        } catch (err) {
            if (err.isTimeout) {
                this._showError('请求超时，请检查网络或服务器');
            } else if (err.isNetworkError || err.code === 0) {
                this._showError('无法连接服务器，请检查后端或网络');
            } else if (err.code === 409) {
                this._showError('该学号已被注册');
            } else if (err.code === 400) {
                this._showError(err.message || '输入有误，请检查');
            } else {
                this._showError(err.message || '注册失败，请稍后重试');
            }
            // 注册失败：保留姓名、学号、班级，清空密码和确认密码
            if (passwordEl) passwordEl.value = '';
            if (confirmEl) confirmEl.value = '';
        } finally {
            this.loading = false;
            this._setLoading(false);
        }
    },

    switchMode(mode) {
        this.mode = mode;
        this.error = '';
        this._message = '';
        const container = document.getElementById('mainContent');
        if (container) {
            this.render(container);
        }
    },

    _setLoading(loading) {
        this.loading = loading;
        const formId = this.mode === 'login' ? 'loginForm' : 'registerForm';
        const btnId = this.mode === 'login' ? 'loginSubmitBtn' : 'registerSubmitBtn';
        const form = document.getElementById(formId);
        const btn = document.getElementById(btnId);

        if (btn) {
            const textSpan = btn.querySelector('.auth-submit-text');
            const spinnerSpan = btn.querySelector('.auth-submit-spinner');
            btn.disabled = loading;
            if (textSpan) textSpan.style.display = loading ? 'none' : '';
            if (spinnerSpan) spinnerSpan.style.display = loading ? '' : 'none';
        }

        // 禁用表单输入
        if (form) {
            const inputs = form.querySelectorAll('input');
            inputs.forEach(el => { el.disabled = loading; });
        }
    },

    _showError(msg) {
        this.error = msg;
        const container = document.getElementById('mainContent');
        if (container) {
            // 只更新 error 元素，避免重新渲染整个表单
            const errorEl = container.querySelector('.auth-error');
            if (errorEl) {
                errorEl.textContent = msg;
                errorEl.style.display = msg ? '' : 'none';
            } else {
                // 如果还没有 error 元素，重新渲染
                this.render(container, this._message);
            }
        }
    },

    _clearError() {
        this.error = '';
        const errorEl = document.querySelector('.auth-error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    },

    _updateLoginButton() {
        const btn = document.getElementById('loginSubmitBtn');
        const passwordEl = document.getElementById('loginPassword');
        if (btn && passwordEl) {
            btn.disabled = !(document.getElementById('loginStudentId')?.value?.trim()) || !passwordEl.value || this.loading;
        }
    },

    _escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
};
