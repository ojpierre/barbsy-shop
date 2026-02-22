"use client"

export default function AdminSettings() {
  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl text-foreground">Settings</h1>

      <div className="grid gap-6 max-w-2xl">
        {/* Store Settings */}
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <h2 className="font-serif text-xl text-foreground mb-4">Store Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Store Name</label>
              <input
                defaultValue="Barbsy"
                className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm"
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Store URL</label>
              <input
                defaultValue={process.env.NEXT_PUBLIC_APP_URL || "https://barbsy.co"}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <h2 className="font-serif text-xl text-foreground mb-4">Payment Methods</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-background">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 text-xs font-bold">M</div>
                <div>
                  <p className="text-sm font-medium">M-PESA (PayHero)</p>
                  <p className="text-xs text-muted-foreground">STK Push payments</p>
                </div>
              </div>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-background">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold">G</div>
                <div>
                  <p className="text-sm font-medium">Google Pay</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard & more</p>
                </div>
              </div>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">Active</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <h2 className="font-serif text-xl text-foreground mb-4">Notifications</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-background">
              <div>
                <p className="text-sm font-medium">WhatsApp Notifications</p>
                <p className="text-xs text-muted-foreground">Order confirmation via Twilio</p>
              </div>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">Configured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
