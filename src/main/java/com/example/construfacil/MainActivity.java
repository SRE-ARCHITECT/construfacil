package com.example.construfacil;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.button.MaterialButton;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        MaterialButton btnOrcamento = findViewById(R.id.btnOrcamento);
        btnOrcamento.setOnClickListener(view -> {
            String orcamento = gerarOrcamento();
            compartilharViaWhatsApp(orcamento);
        });
    }

    private String gerarOrcamento() {
        // Exemplo de orçamento (você deve substituir isso com dados reais)
        return String.format("*Orçamento ConstruFacil*\n\n" +
                "📦 *Lista de Materiais:*\n" +
                "🏗️ Cimento: R$ 50,00\n" +
                "🏖️ Areia: R$ 30,00\n" +
                "🧱 Tijolos: R$ 100,00\n\n" +
                "💰 *Total: R$ 180,00*\n\n" +
                "_Orçamento gerado via app ConstruFacil_");
    }

    private void compartilharViaWhatsApp(String mensagem) {
        try {
            // Verifica se o WhatsApp está instalado
            PackageManager pm = getPackageManager();
            pm.getPackageInfo("com.whatsapp", PackageManager.GET_ACTIVITIES);

            // Cria a intent para compartilhar via WhatsApp
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("text/plain");
            intent.setPackage("com.whatsapp");
            intent.putExtra(Intent.EXTRA_TEXT, mensagem);
            startActivity(intent);
        } catch (PackageManager.NameNotFoundException e) {
            Toast.makeText(this, "WhatsApp não está instalado no dispositivo", Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(this, "Erro ao compartilhar. Por favor, tente novamente.", Toast.LENGTH_LONG).show();
        }
    }
}