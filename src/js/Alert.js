class Alert {
    constructor(title , text, callback){
        this.text = text;
        this.title = title || '提示';
        this.callback = callback;
        this.build();
    }

    build(){
        let tmpl = this.template();
        $('.alert-msg').remove();
        $(document.body).append(tmpl);
        $('#alert-sure').on('click', () => {
            this.callback && this.callback();
            $('.alert-msg').remove();
        });
    }

    template(){
       return `
            <div class="alert-msg">
                <div class="alert-box">
                    <div class="alert-title">
                        <h4>${this.title}</h4>
                    </div>
                    <div class="alert-body">
                        <p>${this.text}</p>
                    </div>
                    <div class="alert-footer">
                        <button type="button" class="btn btn-primary" id="alert-sure">确定</button>
                    </div>
                </div>
            </div>
       `
    }
}

export default Alert;