---
layout: post
title:  "Chamando métodos dinâmicamente com PHP"
date:   2016-06-03 14:39:00 -0200
categories: PHP
---

<p>
	Fala galera, esse é meu primeiro artigo no blog, e vou abordar um assunto interessante que me chamou atenção quando comecei a estudar Laravel, se trata de chamar métodos que ainda não foram definidos dentro da Classe!
</p>

<p>
	Se você já trabalhou com Laravel, deve ter visto que quando você vai chamar uma view, você tem algumas opções para enviar os dados para ela, por exemplo:
</p>

<h4>Enviando via Array</h4>
<pre>
<code class="php">
$produtos = Produtos::all();
return view('produto.listar', ['produtos' => $produtos]);
</code>
</pre>

<h4>Envia via Método</h4>
<pre>
<code class="php">
$produtos = Produtos::all();
return view('produto.listar')->withProdutos($produtos);
// ou return view('produto.listar')->with('produtos', $produtos);
</code>
</pre>

<p>
	Foi ai que veio minha dúvida, como eu consigo chamar um metodo de acordo com o nome da propriedade que eu quero usar, sabendo que ele não existe na minha classe? 
	No artigo não usarei o exemplo de views, mas sim um exemplo comum de consulta no banco de dados, sem delongas, vamos pro código!
</p>

<h3>Construindo nosso Método Dinâmico</h3>
<p>
	Irei usar como exemplo uma persistencia no banco de dados, onde através de um método, passaremos a coluna e seu valor para fazer a consulta no banco.
	<br>
	Por tanto, imagina que tenhamos uma classe <strong>Model</strong>, que é usada para persistir uma tabela no banco de dados.
	<br>
	Na nossa Model, temos um método <strong>get()</strong>, que por sua vez é usado para buscar algum valor na nossa tabela, ele recebe dois parametro, o <strong>$field</strong> que é o nome da coluna, e <strong>$value</strong> que é o valor a ser procurado!
	<br>
	Resumidamente nosso método get() é assim:
</p>

<pre><code class="php">
public function get($field, $value) {
    $statement = $this->db->prepare(sprintf("SELECT * FROM contact WHERE %s = ?", $field));
    $statement->bindParam(1, $value);
    $statement->execute();
    return $statement->fetch(PDO::FETCH_OBJ);
}
</code></pre>

<p>
	Para buscarmos por algum nome na nossa tabela, podemos chama-lo assim:
</p>

<pre><code class="php">
$model = new Model;
$model->get('name', 'Guilherme');
// Isso resultara em: SELECT * FROM contact WHERE name = 'Guilherme'
</code></pre>

<p>
	Ele faria uma busca na tabela 'contact', por algum usuario com a coluna 'name' igual à 'Guilherme'
	<br>
	Certo, mas e se quiséssemos usar um método proprio pra procurar o nome? algo como:
	<br>
	<strong>getName('Guilherme')</strong> ?
	<br>
	Simples, basta criar o método getName($value) dentro da nossa Model!
	<br>
	Mas imagina que nossa tabela tenha mais campos, e queremos procurar pelo e-mail ou pelo ID do contato, teriamos que criar um método getEmail() e getId()? Isso deixaria nossa classe super acoplada!
	<br>
	Para resolver isso, vamos criar nosso método dinâmicamente!
</p>

<h3>Método Mágico</h3>
<p>
	O Primeiro passo, é fazer o PHP interceptar, todo método chamado que não fizer parte do escopo da classe, para isso vamos o <a target="_blank" href="http://php.net/manual/en/language.oop5.overloading.php#object.call">__call()</a>, um <a target="_blank" href="http://php.net/manual/en/language.oop5.magic.php">método mágico</a> do PHP!
</p>
<p>
	O __call() é chamado sempre que algum método inexistente na classe é invocado! Ele recebe dois parametros, o $func  que é o nome do método/função que esta sendo chamado, e $args é um array com os parametros passados!
	<br>
</p>

<pre><code class="php">
public function __call($func, $args) {
    // implementação aqui
}
</code></pre>

<p>
	Bom, como já temos o método get() que faz o trabalho de buscar os contatos no banco, iremos reutiliza-lo, com isso, quando chamarmos nosso método dinâmico, o getName() por exemplo, ele separar o get de Name, para fazer isso vamos usar a função <a target="_blank" href="http://php.net/manual/en/function.substr.php">substr()</a> para retornar parte da string.
	<br>
	Primeiro passo é saber se é o <em>get</em> que está sendo acessado, para isso vamos recortar os 3 primeiros caracteres da string, e ver se retorna o get:
</p>

<pre><code class="php">
public function __call($func, $args) {
    if(substr($func, 0, 3) == "get") {
        // implementação aqui
    }
}
</code></pre>

<p>
	Agora que sabemos que ele está querendo acessar o get, vamos pegar qual coluna ele quer acessar!
	<br>
	Novamente iremos usar o substr(), só que agora eliminando os 3 primeiros caracteres e retornando o nome da coluna!
	<br>Também usaremos a função <a target="_blank" href="http://php.net/manual/en/function.strtolower.php">strtolower</a>, que serve deixar a string em caixa baixa!
</p>

<pre><code class="php">
public function __call($func, $args) {
    if(substr($func, 0, 3) == "get") {
        $field = strtolower(substr($func, 3));
    }
}
</code></pre>

<p>
	Bom, agora que já separamos o GET da COLUNA, vamos pegar o argumento, que na verdade sera o valor a ser procurado no banco!
	<br>
	O segundo parametro do <strong>__call()</strong> retorna um array com os argumentos passados. Como no nosso exemplo só iremos passar um unico argumento, podemos usar a função <a target="_blank" href="http://php.net/manual/en/function.array-shift.php">array_shift</a> para remover o indice desse array, e retornar apenas o seu valor!
</p>

<pre><code class="php">
public function __call($func, $args) {
    if(substr($func, 0, 3) == "get") {
        $field = strtolower(substr($func, 3));
        $arg   = array_shift($args);
    }
}
</code></pre>

<p>
	Pronto, agora que já temos a função get(), o nome da coluna, e o valor a ser procurado, só falta chamarmos nosso método get(), passando os parametros necessários (coluna, valor).
</p>
<p>
	Para chamarmos o método get, iremos usar a função <a target="_blank" href="http://php.net/manual/en/function.call-user-func-array.php">call_user_func_array()</a>, que recebe dois parametros, ambos array.
	<br>
	No primeiro parametro iremos passar um array com o objeto e o método que queremos chamar, e no segundo, um array com os argumentos.
</p>

<pre><code class="php">
/**
 * $this é a instancia da própria classe que esta chamando o método
 * "get" é o nome do nosso método que sera chamado
 * $field é a coluna da nossa tabela
 * $arg é o valor que sera procurado
 */
call_user_func_array([$this, "get"], [$field, $arg]);
</code></pre>

<p>
	Estamos dizendo para o call_user_func_array, chamar o objeto $this (que é a instancia da nossa classe), e chamar o método get(), com os parametros ($field que é a coluna, e $arg que é o valor a ser procurado);
	<br>
	Resumidamente ao chamar getName("Guilherme"), a call_user_func_array ira fazer o seguinte
	<br>
</p>

<pre><code class="php">
call_user_func_array(["$this", "get"], ["name", "guilherme"]);
//  irá chamar $this->get("name", "guilherme")
</code></pre>

<p>
	Simples! Caso a gente queira chamar por outra coluna da tabela, como por exemplo <strong>get("email", "email@emai.com")</strong>, basta chamarmos <strong>getEmail("email@email.com")</strong>
	que ele ira retornar o mesmo resultado!<br>
	Nossa classe final ficara assim:
</p>

<pre><code class="php">
class Model {
	
    /*
     * Métodos de conexão com o banco e etc..
     */
	
    public function get($field, $value) {
        $statement = $this->db->prepare(sprintf("SELECT * FROM pessoas WHERE %s = ?", $field));
        $statement->bindParam(1, $value);
        $statement->execute();
        return $statement->fetch(PDO::FETCH_OBJ);
    }

    public function __call($func, $args) {
        // verifica se ele esta tentando chamar algum get
        if(substr($func, 0, 3) == "get") {
            // pega o nome da coluna
            $field = strtolower(substr($func, 3));
            // retira o indice do array retornando só o valor
            $arg   = array_shift($args);
            // retorna o método get() passando a coluna e o valor como parametro
            return call_user_func_array([$this, "get"], [$field, $arg]);
        }

        // caso não seja chamado nenhum método get, joga exceção
        throw new Exception(sprintf("Método %s não encontrado.", $func));
    }
}
</code></pre>

<p>
	Apesar de ser simples, é uma mão na roda quando precisamos de métodos especificos.
	<br>
	Espero que tenham gostado, caso vocês façam de outra forma ou tenham alguma dúvida, postem nos comentários.
	<br>
	Até a Próxima!
</p>